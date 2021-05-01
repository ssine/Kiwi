/**
 * Management of items
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { AuthManager } from './AuthManager'
import { getLogger } from './Log'
import { usersURI } from '../boot/config'
import { StorageProvider } from './Storage'
import { ItemNotExistsError, NoReadPermissionError, NoWritePermissionError } from './Error'

const logger = getLogger('itemm')

/**
 * Provides a uniform api for managing items on both frontend and backend side.
 * Try to be stateless.
 */
class ItemManager {
  storage: StorageProvider
  systemStorage: StorageProvider
  auth: AuthManager

  constructor(storage: StorageProvider, systemStorage: StorageProvider, auth: AuthManager) {
    this.storage = storage
    this.systemStorage = systemStorage
    this.auth = auth
  }

  async init() {
    await this.systemStorage.init()
    await this.storage.init()
    this.auth.init((await this.storage.getItem(usersURI)) || (await this.systemStorage.getItem(usersURI))!)
  }

  async getItem(uri: string, token: string): Promise<ServerItem> {
    const item = (await this.storage.getItem(uri)) || (await this.systemStorage.getItem(uri))
    if (!item) throw new ItemNotExistsError()
    if (!this.auth.hasReadPermission(token, item)) throw new NoReadPermissionError()
    return item
  }

  async putItem(uri: string, item: ServerItem, token: string): Promise<void> {
    const previousItem = await this.storage.getItem(uri)
    if (previousItem && !this.auth.hasWritePermission(token, previousItem)) throw new NoWritePermissionError()
    await this.storage.putItem(uri, item)
  }

  async deleteItem(uri: string, token: string): Promise<void> {
    const item = await this.storage.getItem(uri)
    if (!item) throw new ItemNotExistsError()
    if (!this.auth.hasWritePermission(token, item)) throw new NoWritePermissionError()
    return this.storage.deleteItem(uri)
  }

  async getSystemItems(): Promise<Record<string, ServerItem>> {
    return this.systemStorage.getAllItems()
  }

  async getSkinnyItems(): Promise<Record<string, Partial<ServerItem>>> {
    const items = await this.storage.getAllItems()
    const result: Record<string, Partial<ServerItem>> = {}
    for (const k in items) {
      const { content, renderedHTML, renderSync, getContentStream, ...rest } = items[k]
      result[k] = rest
    }
    return result
  }

  async getSearchResult(input: string): Promise<Record<string, ServerItem>> {
    const items = await this.storage.getAllItems()
    const res: Record<string, ServerItem> = {}
    const pattern = new RegExp(input, 'gim')
    for (const k in items) {
      const it = items[k]
      if (pattern.test(it.title) || pattern.test(k) || (it.content && pattern.test(it.content))) res[k] = it
    }
    logger.info(`${res.length} result for search ${input} found`)
    return res
  }
}

export default ItemManager
