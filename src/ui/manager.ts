import { template, default_items_uri } from '../boot/config'
import { client_item as item } from './item'
import { post_json } from './common'
import * as sqrl from 'squirrelly'
import * as monaco from 'monaco-editor'

sqrl.autoEscaping(false)

type uri_item_map = Record<string, item>

/**
 * Front end item layer.
 */
class item_manager {
  map: uri_item_map = {}
  item_flow: item[] = []
  item_flow_div!: Element

  /**
   * Get all system items on startup
   */
  async init() {
    this.item_flow_div = document.createElement('div')
    this.item_flow_div.id = 'item-flow'
    this.item_flow_div.className = 'item-flow'
    document.body.append(this.item_flow_div)
    let sys_items = await post_json('/get_system_items', {})
    for (let k in sys_items) {
      this.map[sys_items[k].uri] = sys_items[k]
    }
    this.map[default_items_uri].content.split('\n').forEach(l => this.display_item(l))
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
    let tmpl = await this.get_item_from_uri(template.item)
    let html = sqrl.Render(tmpl.content, {
      title: item.title,
      content: item.html()
    })
    let _ = document.createElement('div')
    _.innerHTML = html
    item.html_element = _.firstElementChild
    let links = item.html_element.querySelectorAll('.item-link')
    links.forEach(el => {
      let e = el as HTMLElement
      e.onclick = async evt => {
        evt.cancelBubble = true;
        evt.stopPropagation();
        evt.preventDefault();
        this.display_item(e.getAttribute('href'))
        return false;
      }
    })
    let edit_button = item.html_element.querySelector('.item-edit') as HTMLElement;
    edit_button.innerHTML = (await this.get_item_from_uri('$kiwi/ui/icon/item-edit.svg')).content
    edit_button.onclick = _ => this.edit_item(item)
    item.displaied = true
    this.item_flow.push(item)
    this.item_flow_div.appendChild(item.html_element)
  }

  async edit_item(it: item) {
    let tmpl = await this.get_item_from_uri(template.item_editor)
    let html = sqrl.Render(tmpl.content, {
      title: it.title
    })
    it.html_element.innerHTML = html
    let editor = monaco.editor.create(it.html_element.querySelector('.edit-item-content'), {
      value: it.content,
      language: 'markdown'
    })
    let save_button = it.html_element.querySelector('.item-save') as HTMLElement;
    save_button.innerHTML = (await this.get_item_from_uri('$kiwi/ui/icon/item-save.svg')).content
    save_button.onclick = _ => {
      it.content = editor.getValue()
      console.log(it.content)
      it.content_parsed = false
      // editor = null
    }
  }

}

let manager = new item_manager()

export { manager }
