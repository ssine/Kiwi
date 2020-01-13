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
   * Render sidebar (move to renderer class later)
   */
  async init() {
    // get system items
    let sys_items = await post_json('/get_system_items', {})
    for (let k in sys_items) {
      this.map[sys_items[k].uri] = (new item()).assign(sys_items[k])
    }
    this.map[default_items_uri].content.split('\n').forEach(l => this.display_item(l))

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

    if (item.displaied && !item.editing) return

    let tmpl = await this.get_item_from_uri(template.item)
    let html = sqrl.Render(tmpl.content, {
      title: item.title,
      content: item.html()
    })

    let frag = document.createRange().createContextualFragment(html)

    let links = frag.querySelectorAll('.item-link')
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
  
    let edit_button = frag.querySelector('.item-edit') as HTMLElement;
    edit_button.innerHTML = (await this.get_item_from_uri('$kiwi/ui/icon/item-edit.svg')).content
    edit_button.onclick = _ => this.edit_item(uri)

    if (item.editing) {
      item.html_element.innerHTML = ''
      item.html_element.append(frag)
      item.editing = false
    } else {
      let el = document.createElement('div')
      el.className = 'item-container'
      el.append(frag)
      item.html_element = el
      this.item_flow.push(item)
      this.item_flow_div.appendChild(item.html_element)
    }

    item.displaied = true
  }

  async edit_item(uri: string) {
    let it = await this.get_item_from_uri(uri)
    it.editing = true

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
    save_button.onclick = async _ => {
      it.content = editor.getValue()
      it.content_parsed = false
      await it.save()
      this.display_item(it.uri)
    }
  }

}

let manager = new item_manager()

export { manager }
