import axios, { AxiosResponse } from "axios"
import { delay } from "../utils/helper"

const getInscrtiption = async (inscriptionId: string) => {
  let data = {
    jsonrpc: "2.0",
    method: "Ordinals.GetInscription",
    params: { id: inscriptionId },
    id: Math.floor(Math.random() * 100000)
  }

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://testnet.ordit.io/rpc",
    data: data
  }

  return axios
    .request(config)
    .then((response) => {
      if (response.status === 200) {
        return response.data
      }
    })
    .catch((error) => {
      console.log(error)
      return null
    })
}

const getInscrtiptionUtxo = async (inscriptionId: string) => {
  let data = {
    jsonrpc: "2.0",
    method: "Ordinals.GetInscriptionUtxo",
    params: { id: inscriptionId },
    id: Math.floor(Math.random() * 100000)
  }

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://testnet.ordit.io/rpc",
    data: data
  }

  return axios
    .request(config)
    .then((response) => {
      if (response.status === 200) {
        return response.data
      }
    })
    .catch((error) => {
      console.log(error)
      return null
    })
}

// 需要后台提供这么一个接口，来访问
const getInscrtiptionFromUnisat = async (inscriptionId: string) => {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://open-api-testnet.unisat.io/v1/indexer/inscription/info/${inscriptionId}`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer 408cd2d10e22b803ce7b2e659c984bde3cd0085c428980c3f788c46d3cf7f4aa"
    }
  }
  return axios
    .request(config)
    .then((response) => {
      if (response.status === 200) {
        return response.data
      }
      return null
    })
    .catch((error) => {
      console.log(error)
      return null
    })
}

// @ts-ignore
export const confirmInscriptionFound = async (inscriptionId: string) => {
  // todo 改成后台的接口
  const res = await getInscrtiptionUtxo(inscriptionId)
  if (res && (res.data || res.result)) {
    return res.data
  } else {
    await delay(5000)
    return confirmInscriptionFound(inscriptionId)
  }
}
