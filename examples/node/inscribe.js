import { JsonRpcDatasource } from "@sadoprotocol/ordit-sdk"
import { Inscriber, Ordit } from "@sadoprotocol/ordit-sdk"

const MNEMONIC = "bone cycle whale exotic fall garbage bunker theme material annual elbow genre"
const network = "testnet"
const datasource = new JsonRpcDatasource({ network })

async function main() {
  // init wallet
  const wallet = new Ordit({
    bip39: MNEMONIC,
    network
  })

  wallet.setDefaultAddress("taproot")

  const dataObject = {
    p: "brc-20",
    op: "deploy",
    tick: "cccc",
    amt: "100"
  }
  const dataString = JSON.stringify(dataObject)
  // new inscription tx
  console.log("taproot address = ", wallet.selectedAddress)
  const transaction = new Inscriber({
    network,
    address: wallet.selectedAddress,
    publicKey: wallet.publicKey,
    changeAddress: wallet.selectedAddress,
    destination: wallet.selectedAddress,
    mediaContent: "Hello World",
    mediaType: "text/plain",
    feeRate: 3,
    meta: {
      // Flexible object: Record<string, any>
      title: "Example title",
      desc: "Lorem ipsum",
      slug: "cool-digital-artifact",
      creator: {
        name: "Your Name",
        email: "artist@example.org",
        address: wallet.selectedAddress
      }
    },
    postage: 1500 // base value of the inscription in sats
  })

  // generate deposit address and fee for inscription
  const revealed = await transaction.generateCommit()
  console.log(`revealed`, revealed) // deposit revealFee to address
  // 拿到这个地址，然后用unisat向这个地址发送转账

  // confirm if deposit address has been funded
  const ready = await transaction.isReady()
  // console.log(transaction.toHex())
  console.log(ready)
  // console.log(transaction.ready)
  // if (ready || transaction.ready) {
  // build transaction
  await transaction.build()
  console.log(transaction.toHex())

  console.log("hex = ", transaction.toHex())
  // sign transaction
  const signedTxHex = wallet.signPsbt(transaction.toHex(), { isRevealTx: true })

  // Broadcast transaction
  const tx = await datasource.relay({ hex: signedTxHex })
  console.log(tx)
  // }
}

main()
