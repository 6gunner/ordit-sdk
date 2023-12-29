import { generateTxUniqueIdentifier, Inscription, processInput } from ".."
import { PSBTBuilder } from "../transactions/PSBTBuilder"
import { BRC20TransferBase } from "./BRC20TransferBase"
import { BRC20TransferExecutorOptions, BRC20TransferPayloadAttributes } from "./types"

export class BRC20TransferExecutor extends PSBTBuilder {
  private tick: string
  private amount = 0
  private destinationAddress: string
  private inscriptionId: string
  constructor({
    address,
    pubKey,
    datasource,
    destinationAddress,
    feeRate,
    network,
    tick,
    amount,
    inscriptionId
  }: BRC20TransferExecutorOptions) {
    super({ address, changeAddress: address, publicKey: pubKey, datasource, feeRate, network, outputs: [] })

    this.destinationAddress = destinationAddress
    this.tick = tick
    this.amount = amount
    this.inscriptionId = inscriptionId
  }

  private async validateTransferOptions() {
    BRC20TransferBase.validateTransferOptions({
      amount: this.amount,
      tick: this.tick,
      datasource: this.datasource,
      network: this.network
    })
  }

  private async findInscriptionUTXOs() {
    const [inscriptionIds, { unspendableUTXOs }] = await Promise.all([
      this.findTokenBalanceInscriptions(),
      this.datasource.getUnspents({
        address: this.address,
        type: "all"
      })
    ])

    return unspendableUTXOs.filter((utxo) => {
      return inscriptionIds.includes(generateTxUniqueIdentifier(utxo.txid, utxo.n))
    })
  }

  // 找到对应的inscriptionId
  private async getInscriptionUTXOs(inscriptionId: string) {
    return await this.datasource.getInscriptionUTXO({ id: inscriptionId })
  }

  private async prepareInscriptionsToTransfer() {
    const utxo = await this.getInscriptionUTXOs(this.inscriptionId)
    if (!utxo) {
      throw new Error("No token balance inscriptions found")
    }
    const promises = [utxo].map((utxo) =>
      processInput({
        utxo,
        pubKey: this.publicKey,
        network: this.network,
        datasource: this.datasource
      })
    )
    this.inputs = await Promise.all(promises)
    this.outputs = [utxo].map((utxo) => ({
      address: this.destinationAddress,
      value: utxo.sats
    }))
  }

  private async pickBRC20Inscriptions(inscriptions: Inscription[]) {
    const filterInscriptions: Array<Inscription & { content: BRC20TransferPayloadAttributes }> = []
    for (const inscription of inscriptions) {
      try {
        const request = await fetch(inscription.mediaContent)
        const downloadedContent = await request.json()
        const content = (
          typeof downloadedContent !== "object" ? JSON.parse(downloadedContent) : downloadedContent
        ) as BRC20TransferPayloadAttributes
        const isBRC20TransferInscription =
          inscription.mediaType.includes("text/plain") && content.p === "brc-20" && content.op === "transfer"

        if (!isBRC20TransferInscription) continue

        if (content.amt >= this.amount.toString()) {
          filterInscriptions.push({
            ...inscription,
            content
          })
        }
      } catch (_) {
        continue
      }
    }

    // Sort inscriptions to spend highest amount transfer ticket first
    return filterInscriptions.sort((a, b) => +b.content.amt - +a.content.amt)
  }

  private async findTokenBalanceInscriptions() {
    const inscriptions = await this.datasource.getInscriptions({
      owner: this.address
    })

    const brc20Inscriptions = await this.pickBRC20Inscriptions(inscriptions)

    const balanceInscriptions = []
    let total = 0
    let currentIndex = 0
    while (this.amount > total && brc20Inscriptions[currentIndex]) {
      const inscription = brc20Inscriptions[currentIndex]
      balanceInscriptions.push(inscription)
      total += +inscription.content.amt
      currentIndex++
    }

    return balanceInscriptions.map((inscription) => inscription.outpoint)
  }

  async transfer() {
    // 目前这个rpc接口有问题，暂时注释了
    // const isTransferableBalanceSufficient = await BRC20TransferBase.hasEnoughTransferableBalance({
    //   address: this.address,
    //   amount: this.amount,
    //   tick: this.tick,
    //   datasource: this.datasource,
    //   network: this.network
    // })

    // if (!isTransferableBalanceSufficient) {
    //   throw new Error("Insufficient transferable balance")
    // }

    // await this.validateTransferOptions()
    await this.prepareInscriptionsToTransfer()
    await this.prepare()
    return this.toPSBT()
  }
}
