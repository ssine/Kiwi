/**
 * Management of items
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { FileSynchronizer } from './FileSynchronizer'
import { generateURI, URIItemMap } from './URI'
import { assignCommonProperties } from './Common'
import { getLogger } from './log'

const logger = getLogger('itemm')

/**
 * Wrapper class of functions when manageing items
 */
class ItemManager {
  itemMap: URIItemMap = {}
  systemItemMap: URIItemMap = {}
  itemLoaded: boolean = false
  systemItemLoaded: boolean = false
  synchronizer: FileSynchronizer = new FileSynchronizer()

  /**
   * Load system and user items with user root path specified.
   */
  async loadItems(rootPath: string) {
    await this.synchronizer.init(rootPath)
    this.itemMap = generateURI(await this.synchronizer.getItemTree(), '')
    this.systemItemMap = generateURI(await this.synchronizer.getSystemItemTree(), '$kiwi/')
    this.itemLoaded = this.systemItemLoaded = false
  }

  getItem(uri: string): ServerItem {
    if (!! this.itemMap[uri]) return this.itemMap[uri]
    if (!! this.systemItemMap[uri]) {
      // TODO: create an identical normal item and return it
      return this.systemItemMap[uri]
    }
    const missing = new ServerItem()
    missing.uri = uri
    this.itemMap[uri] = missing
    return this.itemMap[uri]
  }

  /**
   * sync an item back to filesystem, create one if not exist
   */
  async putItem(it: ServerItem): Promise<ServerItem> {
    let _it = this.getItem(it.uri)
    assignCommonProperties(_it, it)
    _it.missing = false
    // should we await this, i.e., response after item is written to disk?
    await this.synchronizer.saveItem(_it)
    await _it.html()
    return _it
  }

  async saveItem(uri: string, it: ServerItem): Promise<ServerItem> {
    logger.debug(`saving item [${it.uri}] with original uri [${uri}]`)
    if (uri !== it.uri) {
      await this.deleteItem(uri)
    }
    let _it = this.getItem(it.uri)
    assignCommonProperties(_it, it)
    _it.missing = false
    // should we await this, i.e., response after item is written to disk?
    await this.synchronizer.saveItem(_it)
    await _it.html()
    return _it
  }

  async deleteItem(uri: string) {
    let _it = this.getItem(uri)
    await this.synchronizer.deleteItem(_it)
    delete this.itemMap[uri]
    return true
  }

  getItems(uris: string[]): ServerItem[] {
    return uris.map(u => this.getItem(u))
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

}

const manager = new ItemManager()

export default manager
