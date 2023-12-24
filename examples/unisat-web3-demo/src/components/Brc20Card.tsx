import React, { useState } from "react";
import { Card, Input, Button } from "antd";
import { JsonRpcDatasource, unisat } from "@sadoprotocol/ordit-sdk";
import { Inscriber, Ordit } from "@sadoprotocol/ordit-sdk";
import { delay, waitFor, waitForPromise } from "../helper";
import { read } from "fs";

const MNEMONIC =
  "bone cycle whale exotic fall garbage bunker theme material annual elbow genre";
const network = "testnet";
const datasource = new JsonRpcDatasource({ network });

function Brc20Card() {
  const [toAddress, setToAddress] = useState(
    "tb1pzmc2f2rt55husvfwx6z34harcpy8lg8nmng5a59rhj9x3c9tug8see05x9"
  );

  const [brc20TokenName, setBrc20TokenName] = useState<string>("doge");
  const [qty, setQty] = useState<number>(21000000);
  const [limitPerMint, setLimitPerMint] = useState<number>(1000);
  const [txid, setTxid] = useState("");
  const [disabled, setDisabled] = useState(false);

  const handleClick = async () => {
    setDisabled(true);
    const dataObject = {
      p: "brc-20",
      op: "deploy",
      tick: brc20TokenName,
      max: qty,
      lim: limitPerMint,
    };
    const dataString = JSON.stringify(dataObject);
    // init wallet
    const wallet = new Ordit({
      bip39: MNEMONIC,
      network,
    });
    wallet.setDefaultAddress("taproot");

    // new inscription tx
    const transaction = new Inscriber({
      network,
      address: wallet.selectedAddress!,
      publicKey: wallet.publicKey,
      changeAddress: wallet.selectedAddress!,
      destinationAddress: toAddress,
      mediaContent: dataString,
      mediaType: "text/plain",
      feeRate: 3,
      postage: 1500, // base value of the inscription in sats
    });

    // generate deposit address and fee for inscription
    const revealed = await transaction.generateCommit();
    console.log(`revealed`, revealed); // deposit revealFee to address
    // 拿到这个地址，然后用unisat向这个地址发送转账
    try {
      // @ts-ignore
      const txId = await window.unisat.sendBitcoin(
        revealed.address,
        revealed.revealFee
      );
      setTxid(txId);
    } catch (e) {
      setTxid((e as any).message);
    }
    // confirm if deposit address has been funded
    let ready;
    while (true) {
      await delay(5000);
      console.log("....");
      if (ready) {
        // build transaction
        await transaction.build();
        // sign transaction
        const signedTxHex = wallet.signPsbt(transaction.toHex(), {
          isRevealTx: true,
        });
        // Broadcast transaction
        const tx = await datasource.relay({ hex: signedTxHex });
        console.log(tx);
        break;
      } else {
        ready = await transaction.isReady({
          skipStrictSatsCheck: true,
        });
      }
    }
  };
  return (
    <Card size="small" title="BRC20" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Tick</div>
        <Input
          defaultValue={brc20TokenName}
          onChange={(e) => {
            setBrc20TokenName(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Quantity</div>
        <Input
          defaultValue={qty}
          onChange={(e) => {
            setQty(Number(e.target.value));
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
        ></Input>
      </div>

      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={handleClick}
        disabled={disabled}
      >
        Confirm
      </Button>
    </Card>
  );
}

export default Brc20Card;
