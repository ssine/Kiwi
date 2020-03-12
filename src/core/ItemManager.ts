/**
 * Management of items
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { FileSynchronizer, URIItemMap } from './FileSynchronizer'
import { UserManager } from './UserManager' 
import { assignCommonProperties } from './Common'
import { getLogger } from './Log'
import { io as uiNotifier } from './server'
import { usersURI } from '../boot/config'

const logger = getLogger('itemm')

/**
 * Wrapper class of functions when manageing items
 */
class ItemManager {
  itemMap: URIItemMap = {}
  systemItemMap: URIItemMap = {}
  synchronizer: FileSynchronizer = new FileSynchronizer()
  userManager: UserManager = new UserManager()

  /**
   * Load system and user items with user root path specified.
   */
  async loadItems(rootPath: string) {
    this.synchronizer.init(rootPath, {
      onItemChange: this.onStorageChange.bind(this),
      onItemCreate: this.onStorageCreate.bind(this),
      onItemDelete: this.onStorageDelete.bind(this),
    })
    this.itemMap = await this.synchronizer.getItemMap()
    this.systemItemMap = await this.synchronizer.getSystemItemMap()
    await Promise.all(Object.keys(this.systemItemMap).map(k => this.systemItemMap[k].html()))
    const usersItem = this.getItem(usersURI)
    if (usersItem) { 
      this.userManager.init(usersItem.content)
      delete this.systemItemMap[usersURI]
      delete this.itemMap[usersURI]
    }
  }

  getItem(uri: string): ServerItem | null {
    if (!! this.itemMap[uri]) return this.itemMap[uri]
    if (!! this.systemItemMap[uri]) return this.systemItemMap[uri]
    return null
  }

  async saveItem(uri: string, it: ServerItem): Promise<ServerItem> {
    logger.debug(`saving item [${it.uri}] with original uri [${uri}]`)
    if (uri !== it.uri) {
      await this.deleteItem(uri)
    }

    let _it = this.getItem(it.uri)
    if (!_it) _it = new ServerItem()

    if (_it.isSystem) {
      _it = new ServerItem()
      this.systemItemMap[it.uri] = _it
    } else {
      this.itemMap[it.uri] = _it
    }

    assignCommonProperties(_it, it)
    _it.missing = false
    // should we await this, i.e., response after item is written to disk?
    await this.synchronizer.saveItem(_it)
    await _it.html()
    return _it
  }

  async deleteItem(uri: string) {
    let _it = this.getItem(uri)
    if (!_it) {
      logger.warn(`item to delete [${uri}] does not exist!`)
      return
    }
    await this.synchronizer.deleteItem(_it)
    delete this.itemMap[uri]
    logger.info(`item [${uri}] deleted`)
    return true
  }

  getItems(uris: string[]): ServerItem[] {
    return uris.map(u => this.getItem(u)).filter(v => v !== null) as ServerItem[]
  }

  getSystemItems(): ServerItem[] {
    const lst = []
    for (const k in this.systemItemMap) {
      lst.push(this.systemItemMap[k])
    }
    return lst
  }

  getSkinnyItems(): ServerItem[] {
    const lst = []
    for (const k in this.itemMap) {
      let it = new ServerItem()
      it.uri = k
      it.title = this.itemMap[k].title
      it.type = this.itemMap[k].type
      it.headers = this.itemMap[k].headers
      if (it.uri.startsWith('$'))
        it.content = this.itemMap[k].content
      lst.push(it)
    }
    return lst
  }

  getSearchResult(input: string): ServerItem[] {
    const res = []
    const pattern = new RegExp(input, 'gim')
    for (const k in this.itemMap) {
      const it = this.itemMap[k]
      if (pattern.test(it.title) || pattern.test(it.uri) || pattern.test(it.content))
        res.push(it)
    }
    logger.info(`${res.length} result for search ${input} found`)
    return res
  }

  async onStorageChange(item: ServerItem) {
    await item.html()
    // notify ui
    uiNotifier.emit('item-change', {
      item: item
    })
  }
  
  onStorageDelete(item: ServerItem) {
    if (! this.itemMap[item.uri]) return
    delete this.itemMap[item.uri]
    logger.info(`item [${item.uri}] deleted because storage deletion`)
    // notify 
    uiNotifier.emit('item-delete', {
      uri: item.uri
    })
  }

  async onStorageCreate(item: ServerItem) {
    await item.html()
    this.itemMap[item.uri] = item
    logger.info(`item [${item.uri}] created because storage creation`)
    // notify ui
    uiNotifier.emit('item-create', {
      item: item
    })
  }

  getUserManager(): UserManager {
    return this.userManager
  }

}

const manager = new ItemManager()

export default manager
