import { Ordit } from "@sadoprotocol/ordit-sdk"

const OUTPOINT = "105758bb912665f5f803ec0f5268d2218b51978b16de05622c64c9faafd2d22e:0"
const network = "testnet"

const inscription = await Ordit.inscription.getInscriptionDetails(OUTPOINT, network)

console.log(inscription)
