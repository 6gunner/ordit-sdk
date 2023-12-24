import { BRC20TransferGenerator, JsonRpcDatasource, Ordit } from "@sadoprotocol/ordit-sdk"

const MNEMONIC = "bone cycle whale exotic fall garbage bunker theme material annual elbow genre"
const network = "testnet"
const wallet = new Ordit({
  bip39: MNEMONIC,
  network
})
wallet.setDefaultAddress("taproot")
const datasource = new JsonRpcDatasource({ network })

console.log(wallet.selectedAddress)

async function main() {
  const tx = new BRC20TransferGenerator({
    address: wallet.selectedAddress,
    pubKey: wallet.publicKey,
    feeRate: 3,
    network,
    tick: "coda",
    amount: 200
  })

  const revealData = await tx.reveal()
  console.log({ revealData })

  // generate transfer inscription
  const hex = await tx.generate()

  if (hex) {
    const signedTxHex = wallet.signPsbt(hex, { isRevealTx: true })
    const txId = await datasource.relay({ hex: signedTxHex })
    console.log({ txId })
  }
}

main()
