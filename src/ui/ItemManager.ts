import { getItem, getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'

export class ItemManager {
  static instance?: ItemManager
  items: Record<string, ClientItem>
  systemItems: Record<string, ClientItem>
  // tag -> uris of items having this tag
  tagMap: Record<string, string[]>

  async init() {
    this.items = await getSkinnyItems()
    this.systemItems = await getSystemItems()
    this.tagMap = {}
    this.generateTagap()
  }

  async ensureItemLoaded(uri: string) {
    console.log(JSON.stringify(uri))
    console.log(this.items)
    if (this.items[uri].skinny) {
      this.items[uri] = await getItem(uri)
    }
  }

  getItem(uri: string): ClientItem {
    return this.items[uri]
  }

  hasItem(uri: string): boolean {
    return !!this.items[uri] || !!this.systemItems[uri]
  }

  generateTagap() {
    this.tagMap = {}
    for (const [uri, item] of Object.entries(this.items)) {
      if (!item.header.tags) continue
      for (const tag of item.header.tags) {
        if (!this.tagMap[tag]) this.tagMap[tag] = [uri]
        else this.tagMap[tag].push(uri)
      }
    }
  }

  static getInstance(): ItemManager {
    return ItemManager.instance || (ItemManager.instance = new ItemManager())
  }
}
