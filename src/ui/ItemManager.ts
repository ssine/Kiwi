import bus from './eventBus'
import { defaultItemsURI, pageConfigs } from '../boot/config'
import ClientItem from './ClientItem'
import { postJSON, getPositionToDocument } from './Common'
import Renderer from './Renderer'
import { URIParser } from './URIParser'
import { typesetMath } from './mathjax'
import { assignCommonProperties } from '../core/Common'

type URIItemMap = Record<string, ClientItem>

/**
 * Front end item layer.
 */
class ItemManager {
  map: URIItemMap = {}
  itemFlow: ClientItem[] = []
  itemFlowDiv!: Element
  renderer: Renderer
  URIParser: URIParser = new URIParser()
  tagMap: { [tag: string]: ClientItem[] } = {}
  itemTypes: Set<string> = new Set()

  async init() {
    // get system items
    let systemItems = await postJSON('/get-system-items', {})
    for (let k in systemItems) {
      this.map[systemItems[k].uri] = (new ClientItem()).assign(systemItems[k])
    }

    // get skinny items
    let skinnyItems = await postJSON('/get-skinny-items', {})
    for (let k in skinnyItems) {
      let it = new ClientItem()
      it.assign(skinnyItems[k])
      it.contentLoaded = false
      this.map[it.uri] = it
    }

    document.title = this.map[pageConfigs.title].content.trim()

    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/' + pageConfigs.favicon;
    document.getElementsByTagName('head')[0].appendChild(link);

    this.generateTagMap()
    this.generateItemTypes()

    this.URIParser.parseItemTree(this.map)
    
    this.renderer = new Renderer()
    const rootDiv = document.createElement('div')

    // render sidebar
    let sidebarElement = document.createElement('div')
    this.renderer.renderSidebar({
      title: this.map[pageConfigs.title].content.trim(),
      subTitle: this.map[pageConfigs.subTitle].content.trim(),
      itemFlow: this.itemFlow,
      rootNode: this.URIParser.rootNode
    }, sidebarElement)
    rootDiv.append(sidebarElement)

    // render item flow
    this.itemFlowDiv = document.createElement('div')
    this.itemFlowDiv.id = 'item-flow'
    this.itemFlowDiv.className = 'item-flow'
    rootDiv.append(this.itemFlowDiv)

    document.body.append(rootDiv)

    // register event listeners
    bus.on('item-link-clicked', (data) => this.displayItem(this.resolveURI(data.targetURI, data.emitterURI)))
    bus.on('item-close-clicked', (data) => this.closeItem(data.uri))
    bus.on('item-save-clicked', (data) => this.saveItem(data))
    bus.on('item-delete-clicked', (data) => this.deleteItem(data.uri))
    bus.on('create-item-clicked', (data) => this.createItem(data))
    bus.on('search-triggered', (data) => this.processSearch(data))

    // render default items
    this.map[defaultItemsURI].content.split('\n').forEach(l => {
      if (l) {
        console.log('opening default item ', l)
        this.displayItem(l)
      }
    })
  }
  
  async getItemFromURI(uri: string): Promise<ClientItem|null> {
    const possibleIndex = this.concatURI(uri, 'index')
    if (this.map[possibleIndex])
      return this.getItemFromURI(possibleIndex)
    if (this.map[uri] && this.map[uri].contentLoaded) {
      return this.map[uri]
    }
    // fetch from server
    let currentItem = new ClientItem()
    currentItem.uri = uri
    await currentItem.load()
    if(currentItem.title === '') return null
    this.map[uri] = currentItem
    return currentItem
  }

  generateTagMap() {
    for (const k in this.map) {
      if (! this.map[k].headers.tags) continue
      for (const tag of this.map[k].headers.tags) {
        if (! this.tagMap[tag]) this.tagMap[tag] = [this.map[k]]
        else this.tagMap[tag].push(this.map[k])
      }
    }
  }
  
  generateItemTypes() {
    for (const k in this.map) {
      if (! this.map[k].type) continue
      this.itemTypes.add(this.map[k].type)
    }
  }

  scrollToItem(it: ClientItem) {
    const pos = getPositionToDocument(it.containerDiv)
    scrollTo(pos.left, pos.top)
  }

  concatURI(a: string, b: string): string {
    while (a.endsWith('/')) a = a.slice(0, a.length-1)
    while (b.startsWith('/')) b = b.slice(1)
    return `${a}/${b}`
  }

  resolveURI(uri: string, from: string | null): string {
    let stack = []

    const parseToStack = function (input: string) {
      let arr = input.split(/[\\\/]+/g)
      for (let unit of arr) {
        if (unit === '.') continue
        if (unit === '..') stack.pop()
        else stack.push(unit)
      }
    }

    if (typeof from === 'string')
      parseToStack(from)
    stack.pop()
    parseToStack(uri)

    return stack.join('/')
  }

  async displayItem(uri: string) {
    let item = await this.getItemFromURI(uri)
    if (! item) {
      console.log(`item to display [${uri}] dose not exist, creating a missing one`)
      await this.createItem({ uri: uri })
      return
    }
    console.log('displaing ', item)

    if (item.displaied) {
      this.scrollToItem(item)
      return
    }

    let el = document.createElement('div')
    el.className = 'item-container'
    this.renderer.renderItem(item, el, { tagMap: this.tagMap, itemTypes: this.itemTypes })
    this.itemFlowDiv.append(el)
    item.containerDiv = el
    this.itemFlow.push(item)
    
    typesetMath()

    item.displaied = true
    bus.emit('item-displaied')
    bus.emit('item-flow-layout')
    this.scrollToItem(item)
  }

  async closeItem(uri: string) {
    let item = await this.getItemFromURI(uri)

    if (!item.displaied) return

    let flowIdx = this.itemFlow.indexOf(item)
    this.itemFlow.splice(flowIdx, 1)
    this.itemFlowDiv.removeChild(item.containerDiv)
    item.containerDiv = null

    item.displaied = false
    bus.emit('item-closed')
    bus.emit('item-flow-layout')
  }

  async saveItem(data: {uri: string, editedItem: Partial<ClientItem>, token: string}) {
    let item = await this.getItemFromURI(data.uri)
    if (item === null) return

    const changedKeys = {}
    for (let k in data.editedItem) {
      if (item[k] !== data.editedItem[k]) {
        changedKeys[k] = true
        item[k] = data.editedItem[k]
        item.isContentParsed = false
      }
    }
    if (changedKeys['uri']) {
      this.map[data.editedItem.uri] = item
      delete this.map[data.uri]
      this.updateURI()
    }
    if (changedKeys['title'] && !changedKeys['uri']) {
      this.updateURI()
    }
    // TODO: performance issue?
    this.generateTagMap()
    item.editing = false
    item.missing = false
    const { containerDiv, ...itemToSave } = item
    const savedItem = await postJSON('/save-item', {
      uri: data.uri,
      item: itemToSave
    })
    assignCommonProperties(item, savedItem)
    bus.emit(`item-saved-${data.token}`, {item: item})
    bus.emit('item-saved')
  }

  async createItem(data: {uri: string}) {
    const item = new ClientItem()
    item.title = 'New Item'
    item.content = ''
    if (data.uri) item.uri = data.uri
    else item.uri = 'new-item'
    item.editing = true
    item.missing = true
    item.headers.tags = []
    if (this.map[item.uri]) {
      let cnt = 1
      while (this.map[`${item.uri}${cnt}`]) {
        cnt += 1
      }
      item.uri = `${item.uri}${cnt}`
    }
    this.map[item.uri] = item
    this.updateURI()
    this.displayItem(item.uri)
  }

  async deleteItem(uri: string) {
    this.closeItem(uri)
    delete this.map[uri]
    console.log(uri, 'deleted from map')
    this.updateURI()
    postJSON('/delete-item', {uri: uri})
    bus.emit('item-deleted')
  }

  async processSearch(data: { input: string, token: string }) {
    const result = await postJSON('/get-search-result', { input: data.input })
    const lst = []
    for (const res of result) {
      if (!this.map[res.uri]) {
        const cur = new ClientItem()
        cur.assign(res)
        this.map[res.uri] = cur
      }
      lst.push(this.map[res.uri])
    }
    bus.emit(`search-result-${data.token}`, { items: lst })
  }

  updateURI() {
    this.URIParser.parseItemTree(this.map)
    console.log('parsed tree: ', this.URIParser.rootNode)
  }

}

const manager = new ItemManager()

export default manager
