import { BRC20Deploy, JsonRpcDatasource, Ordit } from "@sadoprotocol/ordit-sdk"

const config = {
  MNEMONIC: "bone cycle whale exotic fall garbage bunker theme material annual elbow genre",
  network: "testnet",
  tick: "xnoa"
}

const wallet = new Ordit({
  bip39: config.MNEMONIC,
  network: config.network
})
wallet.setDefaultAddress("taproot")
const datasource = new JsonRpcDatasource({ network: config.network })

async function main() {
  const tx = new BRC20Deploy({
    address: wallet.selectedAddress,
    pubKey: wallet.publicKey,
    destinationAddress: wallet.selectedAddress,
    feeRate: 3,
    network: config.network,
    tick: config.tick,
    supply: 1000000000,
    limit: 100
  })

  const revealData = await tx.reveal()
  console.log({ revealData })

  const hex = await tx.deploy()
  console.log("hex = ", hex)
  const signedTxHex = wallet.signPsbt(hex, { isRevealTx: true })
  const txId = await datasource.relay({ hex: signedTxHex })
  console.log({ txId })
}

main()
