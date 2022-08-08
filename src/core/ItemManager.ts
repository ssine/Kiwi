/**
 * Management of items
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { AuthManager } from './AuthManager'
import { getLogger } from './Log'
import { mainConfigURIs, secretConfigURIs } from '../boot/config'
import { StorageProvider } from './Storage'
import { ItemNotExistsError, NoReadPermissionError, NoWritePermissionError } from './Error'
import { resolveURI } from './Common'
import { getMainConfig, getSecretConfig, MainConfig, SecretConfig } from './config'
import { identity } from 'lodash'

const logger = getLogger('itemm')

/**
 * Provides a uniform api for managing items on both frontend and backend side.
 * Try to be stateless.
 */
export class ItemManager {
  static instance?: ItemManager
  storage!: StorageProvider
  systemStorage!: StorageProvider
  auth!: AuthManager
  mainConfig!: MainConfig
  secretConfig!: SecretConfig

  async init(
    storage: StorageProvider,
    systemStorage: StorageProvider,
    auth: AuthManager,
    render: (uri: string, item: ServerItem) => Promise<void>
  ) {
    this.storage = storage
    this.systemStorage = systemStorage
    this.auth = auth
    await this.systemStorage.init()
    await this.storage.init()
    await this.updateConfig()
    this.auth.init(this.secretConfig)
    await Promise.all(Object.entries(await this.systemStorage.getAllItems()).map(entry => render(...entry)))
  }

  async updateConfig() {
    const getFirstItemFromList = async (uris: string[]) =>
      (await Promise.all(uris.map(u => this.storage.getItem(u)))).find(identity)
    this.mainConfig = getMainConfig(await getFirstItemFromList(mainConfigURIs))
    this.secretConfig = getSecretConfig(await getFirstItemFromList(secretConfigURIs))
  }

  async getItem(uri: string, token: string, noAuth?: boolean): Promise<ServerItem> {
    if (secretConfigURIs.includes(uri)) throw new ItemNotExistsError(`item ${uri} not exists`)
    const item = (await this.storage.getItem(uri)) || (await this.systemStorage.getItem(uri))
    if (!item) throw new ItemNotExistsError(`item ${uri} not exists`)
    if (!noAuth) {
      // check read permission up to root
      let uriToCheck = uri
      while (uriToCheck) {
        const itemToCheck = (await this.storage.getItem(uriToCheck)) || (await this.systemStorage.getItem(uriToCheck))
        if (itemToCheck && !this.auth.hasReadPermission(token, itemToCheck))
          throw new NoReadPermissionError(`no read permission to ${uri}!`)
        uriToCheck = resolveURI(uriToCheck, '.')
      }
    }
    return item
  }

  async putItem(uri: string, item: ServerItem, token: string, noAuth?: boolean): Promise<ServerItem> {
    if (!noAuth) {
      // check write permission up to root
      let uriToCheck = uri
      while (uriToCheck) {
        const itemToCheck = await this.storage.getItem(uriToCheck)
        if (itemToCheck && !this.auth.hasWritePermission(token, itemToCheck))
          throw new NoWritePermissionError(`no write permission to ${uri}!`)
        uriToCheck = resolveURI(uriToCheck, '.')
      }
    }
    const author = this.auth.getUserNameFromToken(token)
    if (!item.header.author && author !== 'anonymous') {
      item.header.author = author
    }
    const newItem = await this.storage.putItem(uri, item)
    if (mainConfigURIs.includes(uri)) {
      await this.updateConfig()
    }
    return newItem
  }

  async deleteItem(uri: string, token: string, noAuth?: boolean): Promise<void> {
    const item = await this.storage.getItem(uri)
    if (!item) throw new ItemNotExistsError(`item to delete (${uri}) not exists`)
    if (!noAuth && !this.auth.hasWritePermission(token, item)) throw new NoWritePermissionError()
    this.storage.deleteItem(uri)
    if (mainConfigURIs.includes(uri)) {
      await this.updateConfig()
    }
    return
  }

  async getSystemItems(): Promise<Record<string, ServerItem>> {
    return this.systemStorage.getAllItems()
  }

  async getAllItems(token: string, noAuth?: boolean): Promise<Record<string, ServerItem>> {
    const items = await this.storage.getAllItems()
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
      .filter(([uri, item]) => !this.auth.hasReadPermission(token, item))
      .forEach(([uri, item]) => addToBannedNode(uri))
    secretConfigURIs.forEach(uri => addToBannedNode(uri))

    return Object.fromEntries(Object.entries(items).filter(([uri, item]) => !isBanned(uri)))
  }

  async getSkinnyItems(token: string, noAuth?: boolean): Promise<Record<string, Partial<ServerItem>>> {
    const items = await this.getAllItems(token, noAuth)
    const result: Record<string, Partial<ServerItem>> = {}
    for (const k in items) {
      const { content, renderedHTML, renderSync, getContentStream, ...rest } = items[k]
      result[k] = rest
    }
    return result
  }

  async getSearchResult(input: string, token: string, noAuth?: boolean): Promise<string[]> {
    const items = await this.getAllItems(token, noAuth)
    const res: Record<string, ServerItem> = {}
    const pattern = new RegExp(input, 'gim')
    for (const k in items) {
      const it = items[k]
      if (pattern.test(it.title) || pattern.test(k) || (it.content && pattern.test(it.content))) res[k] = it
    }
    logger.info(`${res.length} result for search ${input} found`)
    return Object.keys(res)
  }

  static getInstance(): ItemManager {
    return ItemManager.instance || (ItemManager.instance = new ItemManager())
  }
}
