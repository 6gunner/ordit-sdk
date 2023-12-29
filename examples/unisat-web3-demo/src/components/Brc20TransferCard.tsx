import React, { useState } from "react"
import { Card, Input, Button } from "antd"
import { JsonRpcDatasource } from "@sadoprotocol/ordit-sdk"
import { Inscriber, Ordit, BRC20TransferExecutor } from "@sadoprotocol/ordit-sdk"
import { waitUntilUTXO } from "../api/utxo"
import { confirmInscriptionFound } from "../api/inscription"

const MNEMONIC = "bone cycle whale exotic fall garbage bunker theme material annual elbow genre"
const network = "testnet"
const datasource = new JsonRpcDatasource({ network })
const wallet = new Ordit({
  bip39: MNEMONIC,
  network
})
wallet.setDefaultAddress("taproot")

type Brc20TransferCardProps = {
  sourceAddress: string
  pubKey: string
}
function Brc20TransferCard(props: Brc20TransferCardProps) {
  const [toAddress, setToAddress] = useState("tb1plf84y3ak54k6m3kr9rzka9skynkn5mhfjmaenn70epdzamtgpadqu8uxx9")
  const [brc20TokenName, setBrc20TokenName] = useState<string>("peri")
  const [qty, setQty] = useState<string>("100")
  const [txid, setTxid] = useState("")
  const [disabled, setDisabled] = useState(false)
  const fromAddress = props.sourceAddress
  const publicKey = props.pubKey
  const handleClick = async () => {
    setDisabled(true)
    // new inscription tx
    const dataObject = {
      p: "brc-20",
      op: "transfer",
      tick: brc20TokenName,
      amt: qty
    }
    const inscribe = new Inscriber({
      network,
      address: wallet.selectedAddress!,
      publicKey: wallet.publicKey,
      changeAddress: wallet.selectedAddress!,
      destinationAddress: fromAddress,
      mediaContent: JSON.stringify(dataObject),
      mediaType: "text/plain",
      feeRate: 3,
      postage: 1500 // base value of the inscription in sats
    })
    const revealed = await inscribe.generateCommit()
    console.log(`revealed`, revealed)
    // 拿到这个地址，然后用unisat向这个地址发送转账
    try {
      // 拿到这个地址，然后用unisat向这个地址发送转账
      // @ts-ignore
      const commitTxId = await window.unisat.sendBitcoin(revealed.address, revealed.revealFee)
      console.log("发送的交易=", commitTxId)
      const utxos = await waitUntilUTXO(revealed.address)
      console.log(`utxos = `, utxos)
      await inscribe.build({
        txid: utxos[utxos.length - 1].txid,
        n: utxos[utxos.length - 1].vout,
        sats: utxos[utxos.length - 1].value
      })
      // sign transaction
      const signedTxHex = wallet.signPsbt(inscribe.toHex(), {
        isRevealTx: true
      })
      const revealTxid = await datasource.relay({ hex: signedTxHex, validate: false })
      const inscriptionId = `${revealTxid}i0`
      // const inscriptionId = "701c386ff6459c095d35f965d3da6150c9a29da41128e99c56d4f2f203da3592i0"
      // setTxid(inscriptionId)
      await confirmInscriptionFound(inscriptionId)

      const transferExecutor = new BRC20TransferExecutor({
        address: fromAddress,
        pubKey: publicKey,
        destinationAddress: toAddress,
        feeRate: 1,
        network,
        tick: brc20TokenName,
        amount: Number(qty),
        inscriptionId: inscriptionId
      })
      const pbst = await transferExecutor.transfer()
      console.log(`pbst = `, pbst)
      if (pbst) {
        const newHex = transferExecutor.toHex()
        // @ts-ignore
        const signedTxHex = await window.unisat.signPsbt(newHex)
        // @ts-ignore
        const txId = await window.unisat.pushPsbt(signedTxHex)
        console.log(`txId = `, txId)
        setTxid(txId)
      }
      setDisabled(false)
    } catch (e) {
      setTxid((e as any).message)
      setDisabled(false)
    }
  }
  return (
    <Card size="small" title="BRC20 Mint" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Tick</div>
        <Input
          defaultValue={brc20TokenName}
          onChange={(e) => {
            setBrc20TokenName(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Quantity</div>
        <Input
          defaultValue={qty}
          onChange={(e) => {
            setQty(e.target.value)
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value)
          }}
        ></Input>
      </div>

      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button style={{ marginTop: 10 }} onClick={handleClick} disabled={disabled}>
        Confirm
      </Button>
    </Card>
  )
}

export default Brc20TransferCard
