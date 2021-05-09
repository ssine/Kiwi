import { getItem, getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'

export class ItemManager {
  static instance?: ItemManager
  items: Record<string, ClientItem>
  systemItems: Record<string, ClientItem>

  async init() {
    this.items = await getSkinnyItems()
    this.systemItems = await getSystemItems()
  }

  async ensureItemLoaded(uri: string) {
    if (this.items[uri].skinny) {
      this.items[uri] = await getItem(uri)
    }
  }

  getItem(uri: string): ClientItem {
    return this.items[uri]
  }

  static getInstance(): ItemManager {
    return ItemManager.instance || (ItemManager.instance = new ItemManager())
  }
}
