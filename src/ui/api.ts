import { constructErrorFromCode } from '../core/Error'
import ClientItem from './ClientItem'

async function postJSON(url: string, data: Object): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (response.status !== 200) throw new Error('Request failed')
  const packet = await response.json()
  if (packet.code !== 0) throw constructErrorFromCode(packet.code, packet.message)
  return (await response.json()).data
}

async function postFile(url: string, data: Object, file: File): Promise<any> {
  const fm = new FormData()
  for (const [key, val] of Object.entries(data)) {
    fm.append(key, val)
  }
  fm.append('fn', file)
  const response = await fetch(url, {
    method: 'POST',
    body: fm,
  })
  if (response.status !== 200) throw new Error('Request failed')
  const packet = await response.json()
  if (packet.code !== 0) throw constructErrorFromCode(packet.code, packet.message)
  return (await response.json()).data
}

const getItem = async (uri: string): Promise<ClientItem> => {
  return postJSON('/get-item', { uri: uri })
}

const putItem = async (uri: string, item: any): Promise<void> => {
  return postJSON('/put-item', { uri: uri, item: item })
}
