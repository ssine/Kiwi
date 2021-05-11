import { getItem, getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'

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
    console.log(this.rootUriNode)
  }

  async ensureItemLoaded(uri: string) {
    if (this.items[uri].skinny) {
      this.items[uri] = await getItem(uri)
    }
  }

  getItem(uri: string): ClientItem | null {
    return this.items[uri] || this.systemItems[uri]
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
