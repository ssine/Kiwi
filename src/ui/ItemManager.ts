import { suggestedURIToTitle } from '../core/Common'
import { ItemNotExistsError } from '../core/Error'
import { isBinaryType } from '../core/MimeType'
import { deleteItem, getItem, getSkinnyItems, getSystemItems, putBinaryItem, putItem } from './api'
import { ClientItem } from './ClientItem'
import { eventBus } from './eventBus'

export type UriNode = {
  // absolute uri of this node
  uri: string
  childs: UriNode[]
}

/**
 * A global item-related data manager for front end
 */
export class ItemManager {
  static instance?: ItemManager
  items: Record<string, ClientItem>
  systemItems: Record<string, ClientItem>
  // tag -> uris of items having this tag
  tagMap: Record<string, string[]>
  // root of uris in tree structure
  rootUriNode: UriNode

  async init() {
    this.items = await getSkinnyItems()
    this.systemItems = await getSystemItems()
    this.tagMap = {}
    this.generateTagMap()
    this.generateUriTree()
  }

  async ensureItemLoaded(uri: string) {
    // Make sure an item is loaded (with content available)
    // item already loaded
    if (uri in this.items && !this.items[uri].skinny) return
    // system items are also loaded
    if (!(uri in this.items) && uri in this.systemItems) return
    // need fetching or not exists
    this.items[uri] = await getItem(uri)
  }

  createItem(uri?: string): string {
    if (!uri) {
      uri = 'new-item'
      if (this.items[uri]) {
        let cnt = 1
        while (this.items[`${uri}${cnt}`]) {
          cnt += 1
        }
        uri = `${uri}${cnt}`
      }
    }
    this.items[uri] = {
      title: suggestedURIToTitle(uri),
      type: 'text/markdown',
      header: {
        createTime: Date.now(),
      },
      content: '',
      skinny: false,
      renderSync: false,
      renderedHTML: 'Content not rendered!',
      new: true,
    }
    return uri
  }

  duplicateItem(uri: string): string {
    const item = this.getItem(uri)
    if (!item) throw new ItemNotExistsError(`item ${uri} not exists!`)
    let cnt = 1
    while (this.getItem(`${uri}${cnt}`)) {
      cnt += 1
    }
    uri = `${uri}${cnt}`
    this.items[uri] = {
      ...item,
      title: suggestedURIToTitle(uri),
      header: {
        ...item.header,
        createTime: Date.now(),
      },
      new: true,
    }
    return uri
  }

  // get item in sync for effciency, call ensureItemLoaded first
  getItem(uri: string): ClientItem | null {
    return this.items[uri] || this.systemItems[uri]
  }

  async deleteItem(uri: string) {
    if (uri in this.items) {
      if (!this.items[uri].new) {
        await deleteItem(uri)
      }
      delete this.items[uri]
      this.generateTagMap()
      this.generateUriTree()
      eventBus.emit('item-deleted', { uri })
    }
  }

  async saveItem(uri: string, item: ClientItem, file?: File): Promise<ClientItem> {
    let rendered: ClientItem
    if (isBinaryType(item.type)) {
      rendered = await putBinaryItem(uri, item, file)
    } else {
      rendered = await putItem(uri, item)
    }
    this.items[uri] = rendered
    this.generateTagMap()
    this.generateUriTree()
    eventBus.emit('item-saved', { uri, item })
    return rendered
  }

  hasItem(uri: string): boolean {
    return !!this.items[uri] || !!this.systemItems[uri]
  }

  generateTagMap() {
    this.tagMap = {}
    for (const [uri, item] of Object.entries(this.items)) {
      if (!item.header.tags) continue
      for (const tag of item.header.tags) {
        if (!this.tagMap[tag]) this.tagMap[tag] = [uri]
        else this.tagMap[tag].push(uri)
      }
    }
  }

  generateUriTree() {
    const root: UriNode = {
      uri: '/',
      childs: [],
    }

    // TODO: performance issue, consider changing algorithm
    const traverse = (segments: string[]): UriNode => {
      let cur_node = root
      for (const [idx, seg] of segments.entries()) {
        if (seg === '') continue
        const uri = segments.slice(0, idx + 1).join('/')
        const next_nodes = cur_node.childs.filter(node => node.uri === uri)
        if (next_nodes.length > 0) {
          cur_node = next_nodes[0]
        } else {
          const new_node = {
            uri: uri,
            childs: [],
          }
          cur_node.childs.push(new_node)
          cur_node = new_node
        }
      }
      return cur_node
    }

    Object.keys(Object.assign({}, this.systemItems, this.items)).forEach(uri => traverse(uri.split('/')))
    this.rootUriNode = root
  }

  static getInstance(): ItemManager {
    return ItemManager.instance || (ItemManager.instance = new ItemManager())
  }
}
