import { constructErrorFromCode } from '../core/Error'
import { ClientItem } from './ClientItem'

export async function postJSON(url: string, data: Object): Promise<any> {
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
  return packet.data
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
  return packet.data
}

export const getItem = async (uri: string): Promise<ClientItem> => {
  return postJSON('/get-item', { uri: uri })
}

export const getSystemItems = async (): Promise<Record<string, ClientItem>> => {
  return postJSON('/get-system-items', {})
}

export const getSkinnyItems = async (): Promise<Record<string, ClientItem>> => {
  return postJSON('/get-skinny-items', {})
}

export const putItem = async (uri: string, item: ClientItem): Promise<ClientItem> => {
  return postJSON('/put-item', { uri: uri, item: item })
}

export const putBinaryItem = async (uri: string, item: ClientItem, file: File): Promise<ClientItem> => {
  return postFile('/put-binary-item', { uri: uri, item: JSON.stringify(item) }, file)
}

export const deleteItem = async (uri: string): Promise<void> => {
  return postJSON('/delete-item', { uri: uri })
}

export const getSearchResult = async (input: string): Promise<string[]> => {
  return postJSON('/get-search-result', { input: input })
}
