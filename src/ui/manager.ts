import bus from './eventBus'
import { template, default_items_uri } from '../boot/config'
import { client_item as item } from './item'
import { post_json } from './common'
import * as sqrl from 'squirrelly'
import * as monaco from 'monaco-editor'
import { Renderer } from './renderer'

sqrl.autoEscaping(false)

type uri_item_map = Record<string, item>

/**
 * Front end item layer.
 */
class item_manager {
  map: uri_item_map = {}
  item_flow: item[] = []
  item_flow_div!: Element
  renderer: Renderer

  /**
   * Get all system items on startup
   * Render sidebar (move to renderer class later)
   */
  async init() {
    // get system items
    let sys_items = await post_json('/get_system_items', {})
    for (let k in sys_items) {
      this.map[sys_items[k].uri] = (new item()).assign(sys_items[k])
    }
    this.map[default_items_uri].content.split('\n').forEach(l => this.display_item(l))

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
  
  async get_item_from_uri(uri: string): Promise<item|null> {
    if (this.map[uri])
      return this.map[uri]
    // fetch from server
    let cur_item = new item()
    cur_item.uri = uri
    await cur_item.load()
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

let manager = new item_manager()

export { manager }
