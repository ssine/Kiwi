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
  item_flow: ClientItem[] = []
  item_flow_div!: Element
  renderer: Renderer

  /**
   * Get all system items on startup
   * Render sidebar (move to renderer class later)
   */
  async init() {
    // get system items
    let sys_items = await postJSON('/get-system-items', {})
    for (let k in sys_items) {
      this.map[sys_items[k].uri] = (new ClientItem()).assign(sys_items[k])
    }
    this.map[defaultItemsURI].content.split('\n').forEach(l => this.display_item(l))

    this.renderer = new Renderer()

    // render sidebar
    let sidebarElement = document.createElement('div')
    this.renderer.render_sidebar({
      title: `Sine's Wiki`,
      subTitle: `Happiness is a choice`,
      itemFlow: this.item_flow,
    }, sidebarElement)
    document.body.append(sidebarElement)

    // render item flow
    this.item_flow_div = document.createElement('div')
    this.item_flow_div.id = 'item-flow'
    this.item_flow_div.className = 'item-flow'
    document.body.append(this.item_flow_div)

    bus.on('item-link-clicked', (data) => this.display_item(data.targetLink))
    bus.on('item-close-clicked', (data) => this.close_item(data.uri))
    bus.on('create-item', this.createItem.bind(this))
  }
  
  async get_item_from_uri(uri: string): Promise<ClientItem|null> {
    if (this.map[uri])
      return this.map[uri]
    // fetch from server
    let cur_item = new ClientItem()
    cur_item.uri = uri
    await cur_item.load()
    console.log(cur_item)
    if(cur_item.title === '') return null
    this.map[uri] = cur_item
    return cur_item
  }

  async display_item(uri: string) {
    let item = await this.get_item_from_uri(uri)

    if (item.displaied) return

    let el = document.createElement('div')
    el.className = 'item-container'
    this.renderer.render_item(item, el)
    this.item_flow_div.append(el)
    item.html_element = el
    console.log(item.html_element)
    this.item_flow.push(item)

    item.displaied = true
    bus.emit('item-displaied')
  }

  async close_item(uri: string) {
    let item = await this.get_item_from_uri(uri)

    if (!item.displaied) return

    let flow_idx = this.item_flow.indexOf(item)
    this.item_flow.splice(flow_idx, 1)
    this.item_flow_div.removeChild(item.html_element)
    item.html_element = null

    item.displaied = false
    bus.emit('item-closed')
  }

  async createItem() {
    
  }

}

const manager = new ItemManager()

export default manager
