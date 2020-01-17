import bus from './eventBus'
import { defaultItemsURI } from '../boot/config'
import ClientItem from './ClientItem'
import { postJSON } from './Common'
import Renderer from './Renderer'

type URIItemMap = Record<string, ClientItem>

/**
 * Front end item layer.
 */
class ItemManager {
  map: URIItemMap = {}
  itemFlow: ClientItem[] = []
  itemFlowDiv!: Element
  renderer: Renderer

  /**
   * Get all system items on startup
   * Render sidebar (move to renderer class later)
   */
  async init() {
    // get system items
    let systemItems = await postJSON('/get-system-items', {})
    for (let k in systemItems) {
      this.map[systemItems[k].uri] = (new ClientItem()).assign(systemItems[k])
    }
    this.map[defaultItemsURI].content.split('\n').forEach(l => this.displayItem(l))

    this.renderer = new Renderer()

    // render sidebar
    let sidebarElement = document.createElement('div')
    this.renderer.renderSidebar({
      title: `Sine's Wiki`,
      subTitle: `Happiness is a choice`,
      itemFlow: this.itemFlow,
    }, sidebarElement)
    document.body.append(sidebarElement)

    // render item flow
    this.itemFlowDiv = document.createElement('div')
    this.itemFlowDiv.id = 'item-flow'
    this.itemFlowDiv.className = 'item-flow'
    document.body.append(this.itemFlowDiv)

    bus.on('item-link-clicked', (data) => this.displayItem(data.targetLink))
    bus.on('item-close-clicked', (data) => this.closeItem(data.uri))
    bus.on('create-item', this.createItem.bind(this))
  }
  
  async getItemFromURI(uri: string): Promise<ClientItem|null> {
    if (this.map[uri])
      return this.map[uri]
    // fetch from server
    let currentItem = new ClientItem()
    currentItem.uri = uri
    await currentItem.load()
    console.log(currentItem)
    if(currentItem.title === '') return null
    this.map[uri] = currentItem
    return currentItem
  }

  async displayItem(uri: string) {
    let item = await this.getItemFromURI(uri)

    if (item.displaied) return

    let el = document.createElement('div')
    el.className = 'item-container'
    this.renderer.renderItem(item, el)
    this.itemFlowDiv.append(el)
    item.DOMElement = el
    console.log(item.DOMElement)
    this.itemFlow.push(item)

    item.displaied = true
    bus.emit('item-displaied')
    bus.emit('item-flow-layout')
  }

  async closeItem(uri: string) {
    let item = await this.getItemFromURI(uri)

    if (!item.displaied) return

    let flowIdx = this.itemFlow.indexOf(item)
    this.itemFlow.splice(flowIdx, 1)
    this.itemFlowDiv.removeChild(item.DOMElement)
    item.DOMElement = null

    item.displaied = false
    bus.emit('item-closed')
    bus.emit('item-flow-layout')
  }

  async createItem() {
    
  }

}

const manager = new ItemManager()

export default manager
