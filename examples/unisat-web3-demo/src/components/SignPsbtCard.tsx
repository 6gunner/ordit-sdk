import React, { useState } from "react"
import { Card, Input, Button } from "antd"
import { ordit } from "@sadoprotocol/ordit-sdk" //import Ordit
import { PSBTBuilder } from "@sadoprotocol/ordit-sdk"

const network = "testnet"

type SignPsbtCardProps = {
  pubKey: string
  address: string
}
function SignPsbtCard(props: SignPsbtCardProps) {
  const [psbtHex, setPsbtHex] = useState("")
  const [psbtResult, setPsbtResult] = useState("")

  const buildPsbt1 = async () => {
    return ordit.transactions.createPsbt({
      pubKey: props.pubKey,
      address: props.address,
      outputs: [
        {
          address: "tb1qatkgzm0hsk83ysqja5nq8ecdmtwl73zwurawww",
          value: 1200
        }
      ],
      network,
      satsPerByte: 1 // 费率 sat/byte
    })
  }
  const buildPsbt2 = async () => {
    const psbtBuilder = new PSBTBuilder({
      address: props.address,
      feeRate: 1,
      network,
      publicKey: props.pubKey,
      outputs: [
        {
          address: "tb1pjjq4snuntgja3ggyluncdlkvhxw26gm8pkfgjc8jvhh3asyaj6as4uctjg",
          value: 600
        }
      ]
    })
    await psbtBuilder.prepare()

    const hex = psbtBuilder.toHex()
    console.log(`hex = `, hex)

    const psbt = psbtBuilder.toPSBT()
    return psbt
  }
  const handleClick = async () => {
    // 构造一笔转账的psbt
    const psbt = await buildPsbt2()
    setPsbtHex(psbt.toHex())
    try {
      // You need to sign this externally (tip: try window.unisat.signPsbt)
      const psbtResult = await (window as any).unisat.signPsbt(psbt.toHex())
      const txId = await (window as any).unisat.pushPsbt(psbtResult)
      console.log(txId)
      setPsbtResult(txId)
    } catch (e) {
      setPsbtResult((e as any).message)
    }
  }

  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>PsbtHex:</div>
        <Input.TextArea value={psbtHex} readOnly></Input.TextArea>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Result:</div>
        <div style={{ wordWrap: "break-word" }}>{psbtResult}</div>
      </div>
      <Button style={{ marginTop: 10 }} onClick={handleClick}>
        Sign Psbt
      </Button>
    </Card>
  )
}

export default SignPsbtCard
