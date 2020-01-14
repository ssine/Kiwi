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
    let tmpl = await this.get_item_from_uri(template.sidebar)
    let sidebar_str = sqrl.Render(tmpl.content, {
      site_title: `Sine's Wiki`,
      site_subtitle: `Happiness is a choice`
    })
    let sidebar_frag = document.createRange().createContextualFragment(sidebar_str)
    document.body.append(sidebar_frag)
    let new_item_button = document.querySelector('#new-item-button') as HTMLElement;
    new_item_button.innerHTML = (await this.get_item_from_uri('$kiwi/ui/icon/new-item.svg')).content
    new_item_button.onclick = async _ => {
      // emit a new event?
      // event bus not implemented yet
      console.log('new item!')
    }
    let search_button = document.querySelector('#sidebar-search-button') as HTMLElement;
    search_button.innerHTML = (await this.get_item_from_uri('$kiwi/ui/icon/search.svg')).content


    // render item flow
    this.item_flow_div = document.createElement('div')
    this.item_flow_div.id = 'item-flow'
    this.item_flow_div.className = 'item-flow'
    document.body.append(this.item_flow_div)

    bus.on('item-link-clicked', (data) => this.display_item(data.targetLink))
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
    this.item_flow.push(item)

    item.displaied = true
  }

}

let manager = new item_manager()

export { manager }
