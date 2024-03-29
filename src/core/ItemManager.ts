/**
 * Management of items
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { getLogger } from './Log'
import { mainConfigURIs, secretConfigURIs } from '../boot/config'
import { ItemNotExistsError, NoReadPermissionError, NoWritePermissionError } from './Error'
import { resolveURI } from './Common'
import { state } from './state'
import { AuthManager } from './AuthManager'
import { updateConfig } from './config'
import { runInAction } from 'mobx'
import { ClientItem } from '../ui/ClientItem'
import { renderItem } from './render'

const logger = getLogger('itemm')

export class ItemManager {
  static async getItem(uri: string, token: string, noAuth?: boolean): Promise<ServerItem> {
    uri = transformUUID(uri)
    if (secretConfigURIs.includes(uri)) throw new ItemNotExistsError(`item ${uri} not exists`)
    const item = (await state.storage.getItem(uri)) || (await state.systemStorage.getItem(uri))
    if (!item) throw new ItemNotExistsError(`item ${uri} not exists`)
    if (!noAuth) {
      // check read permission up to root
      let uriToCheck = uri
      while (uriToCheck) {
        const itemToCheck = (await state.storage.getItem(uriToCheck)) || (await state.systemStorage.getItem(uriToCheck))
        if (itemToCheck && !AuthManager.hasReadPermission(token, itemToCheck))
          throw new NoReadPermissionError(`no read permission to ${uri}!`)
        uriToCheck = resolveURI(uriToCheck, '.')
      }
    }
    return item
  }

  static async putItem(uri: string, item: ServerItem, token: string, noAuth?: boolean): Promise<ServerItem> {
    uri = transformUUID(uri)
    if (!noAuth) {
      // check write permission up to root
      let uriToCheck = uri
      while (uriToCheck) {
        const itemToCheck = await state.storage.getItem(uriToCheck)
        if (itemToCheck && !AuthManager.hasWritePermission(token, itemToCheck))
          throw new NoWritePermissionError(`no write permission to ${uri}!`)
        uriToCheck = resolveURI(uriToCheck, '.')
      }
    }
    const author = AuthManager.getUserNameFromToken(token)
    if (!item.header.author && author !== 'anonymous') {
      item.header.author = author
    }
    const oldItem = await state.storage.getItem(uri)
    if (oldItem && oldItem.type !== item.type) {
      // in filesystem case, uri together with file type determins a file
      // so we have to remove the other one first to avoid confusion later
      await state.storage.deleteItem(uri, oldItem.type)
    }
    const newItem = await state.storage.putItem(uri, item)
    runInAction(() => {
      delete state.renderCache[uri]
    })
    // HACK: refactor to mobx side effects later
    setImmediate(async () => {
      if (mainConfigURIs.includes(uri)) {
        await updateConfig()
      }
      // HACK: support secret hot reload too.
      // The problem is that frontend token expires and thus cannot delete
      // the original item if we hot reload the tokens.
      // So we delay the update by 3s temporarily.
      if (secretConfigURIs.includes(uri)) {
        setTimeout(() => {
          updateConfig()
        }, 3000)
      }
      await updateUUIDLookup()
    })
    return newItem
  }

  static async deleteItem(uri: string, token: string, noAuth?: boolean): Promise<void> {
    uri = transformUUID(uri)
    const item = await state.storage.getItem(uri)
    if (!item) throw new ItemNotExistsError(`item to delete (${uri}) not exists`)
    if (!noAuth && !AuthManager.hasWritePermission(token, item)) throw new NoWritePermissionError()
    state.storage.deleteItem(uri)
    runInAction(() => {
      delete state.renderCache[uri]
    })
    setImmediate(async () => {
      if (mainConfigURIs.includes(uri)) {
        await updateConfig()
      }
      await updateUUIDLookup()
    })
    return
  }

  static async getSystemItems(): Promise<Record<string, ServerItem>> {
    return state.systemStorage.getAllItems()
  }

  static async getAllItems(token: string, noAuth?: boolean): Promise<Record<string, ServerItem>> {
    const items = await state.storage.getAllItems()
    if (noAuth) return items

    type Node = {
      name: string
      childs: Record<string, Node>
    }

    const bannedNodes: Node = { name: '', childs: {} }

    const addToBannedNode = (uri: string) => {
      let cur = bannedNodes
      for (const name of uri.split('/')) {
        // abort if a banned parent exists
        if (cur.childs[name] && Object.keys(cur.childs[name].childs).length === 0) return
        if (!cur.childs[name]) {
          cur.childs[name] = {
            name: name,
            childs: {},
          }
        }
        cur = cur.childs[name]
      }
      cur.childs = {}
    }
    const isBanned = (uri: string): boolean => {
      let cur = bannedNodes
      let name = ''
      for (name of uri.split('/')) {
        if (!cur.childs[name]) {
          if (cur.name === '') return false
          if (Object.keys(cur.childs).length === 0) {
            return true
          } else {
            return false
          }
        }
        cur = cur.childs[name]
      }
      return Object.keys(cur.childs).length === 0
    }

    Object.entries(items)
      .filter(([uri, item]) => !AuthManager.hasReadPermission(token, item))
      .forEach(([uri, item]) => addToBannedNode(uri))
    secretConfigURIs.forEach(uri => addToBannedNode(uri))

    return Object.fromEntries(Object.entries(items).filter(([uri, item]) => !isBanned(uri)))
  }

  static async getSkinnyItems(token: string, noAuth?: boolean): Promise<Record<string, Partial<ServerItem>>> {
    const items = await ItemManager.getAllItems(token, noAuth)
    const result: Record<string, Partial<ServerItem>> = {}
    for (const k in items) {
      const { content, getContentStream, ...rest } = items[k]
      result[k] = rest
    }
    return result
  }

  static async getSearchResult(input: string, token: string, noAuth?: boolean): Promise<string[]> {
    const items = await ItemManager.getAllItems(token, noAuth)
    const res: Record<string, ServerItem> = {}
    const pattern = new RegExp(input, 'gim')
    for (const k in items) {
      const it = items[k]
      if (pattern.test(it.title) || pattern.test(k) || (it.content && pattern.test(it.content))) res[k] = it
    }
    logger.info(`${res.length} result for search ${input} found`)
    return Object.keys(res)
  }
}

export const updateUUIDLookup = async () => {
  const items = await state.storage.getAllItems()
  const table = Object.fromEntries(
    Object.entries(items)
      .filter(tp => tp[1].header.uuid)
      .map(([uri, item]) => [item.header.uuid, uri])
  )
  runInAction(() => {
    state.uuidLookup = table
  })
}

export const transformUUID = (id: string, config?: { prependSlash?: boolean }) => {
  id = id.trim()
  return state.uuidLookup[id] ? (config?.prependSlash ? '/' : '') + state.uuidLookup[id] : id
}

export const toClientItem = async (uri: string, item: ServerItem): Promise<ClientItem> => {
  return { ...item, renderedHTML: await renderItem(uri, item), renderSync: true, state: 'full' }
}
