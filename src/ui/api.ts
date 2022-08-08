import { MainConfig } from '../core/config'
import { constructErrorFromCode } from '../core/Error'
import { ClientItem } from './ClientItem'
import { MessageType, showMessage } from './features/messageList/messageListSlice'

export async function postJSON(url: string, data: Object): Promise<any> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  } catch (err) {
    showMessage({ type: MessageType.error, text: `Error fetching ${url}: ${err.message}`, liveSecond: 5 })
    throw err
  }
  if (response.status !== 200) throw new Error('Request failed')
  const packet = await response.json()
  if (packet.code !== 0) {
    const err = constructErrorFromCode(packet.code, packet.message)
    err.stack = packet.stack
    showMessage({ type: MessageType.error, text: packet.message, liveSecond: 5 })
    throw err
  }
  return packet.data
}

async function postFile(url: string, data: Object, file: File): Promise<any> {
  const fm = new FormData()
  for (const [key, val] of Object.entries(data)) {
    fm.append(key, val)
  }
  fm.append('fn', file)
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      body: fm,
    })
  } catch (err) {
    showMessage({ type: MessageType.error, text: `Error fetching ${url}: ${err.message}`, liveSecond: 5 })
    throw err
  }
  if (response.status !== 200) throw new Error('Request failed')
  const packet = await response.json()
  if (packet.code !== 0) {
    const err = constructErrorFromCode(packet.code, packet.message)
    err.stack = packet.stack
    showMessage({ type: MessageType.error, text: packet.message, liveSecond: 5 })
    throw err
  }
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

export const getMainConfig = async (): Promise<MainConfig> => {
  return postJSON('/get-main-config', {})
}

export const getSearchResult = async (input: string): Promise<string[]> => {
  return postJSON('/get-search-result', { input: input })
}
