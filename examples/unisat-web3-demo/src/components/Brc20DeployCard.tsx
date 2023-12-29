import React, { useState } from "react"
import { Card, Input, Button } from "antd"
import { JsonRpcDatasource, unisat } from "@sadoprotocol/ordit-sdk"
import { Inscriber, Ordit } from "@sadoprotocol/ordit-sdk"
import { waitUntilUTXO } from "../api/utxo"

const MNEMONIC = "bone cycle whale exotic fall garbage bunker theme material annual elbow genre"
const network = "testnet"
const datasource = new JsonRpcDatasource({ network })
// init wallet
const wallet = new Ordit({
  bip39: MNEMONIC,
  network
})
wallet.setDefaultAddress("taproot")

function Brc20DeployCard() {
  const [toAddress, setToAddress] = useState("tb1pzmc2f2rt55husvfwx6z34harcpy8lg8nmng5a59rhj9x3c9tug8see05x9")
  const [brc20TokenName, setBrc20TokenName] = useState<string>("peri")
  const [qty, setQty] = useState<string>("21000000")
  const [limitPerMint, setLimitPerMint] = useState<string>("1000")
  const [txid, setTxid] = useState("")
  const [disabled, setDisabled] = useState(false)

  const handleClick = async () => {
    setDisabled(true)
    const dataObject = {
      p: "brc-20",
      op: "deploy",
      tick: brc20TokenName,
      max: qty,
      lim: limitPerMint
    }
    const dataString = JSON.stringify(dataObject)

    // new inscription tx
    const inscribe = new Inscriber({
      network,
      address: wallet.selectedAddress!,
      publicKey: wallet.publicKey,
      changeAddress: wallet.selectedAddress!,
      destinationAddress: toAddress,
      mediaContent: dataString,
      mediaType: "text/plain",
      feeRate: 4,
      postage: 1500 // base value of the inscription in sats
    })
    // generate deposit address and fee for inscription
    const revealed = await inscribe.generateCommit()
    console.log(`revealed`, revealed) // deposit revealFee to address
    try {
      // 拿到这个地址，然后用unisat向这个地址发送转账
      // @ts-ignore
      const commitTxId = await window.unisat.sendBitcoin(revealed.address, revealed.revealFee)
      console.log("发送的交易=", commitTxId)
      const utxos = await waitUntilUTXO(revealed.address)
      console.log(`utxos = `, utxos)
      // 获取合适的unspent tx
      // const uTXOLimited = await inscribe.fetchAndSelectSuitableUnspent({ skipStrictSatsCheck: true })
      // console.log(`uTXOLimited = `, uTXOLimited)
      // await inscribe.build(uTXOLimited)
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
      setTxid(inscriptionId)
      setDisabled(false)
    } catch (e) {
      setTxid((e as any).message)
    }
  }
  return (
    <Card size="small" title="BRC20 Deploy" style={{ width: 300, margin: 10 }}>
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

export default Brc20DeployCard
