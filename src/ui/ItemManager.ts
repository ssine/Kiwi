import socketIO from 'socket.io-client'
import bus from './eventBus'
import { defaultItemsURI, pageConfigs } from '../boot/config'
import ClientItem from './ClientItem'
import { postJSON, getPositionToDocument, setPageColors, CSSColorToRGBA, RGBtoHSV } from './Common'
import Renderer from './Renderer'
import { URIParser } from './URIParser'
import { typesetMath } from './mathjax'
import { assignCommonProperties, resolveURI, suggestedURIToTitle } from '../core/Common'

type URIItemMap = Record<string, ClientItem>

/**
 * Front end item layer.
 */
class ItemManager {
  map: URIItemMap = {}
  sysMap: URIItemMap = {}
  itemFlow: ClientItem[] = []
  itemFlowDiv!: Element
  renderer: Renderer
  URIParser: URIParser = new URIParser()
  tagMap: { [tag: string]: ClientItem[] } = {}
  itemTypes: Set<string> = new Set()
  io = socketIO()

  async init() {
    // get system items
    let systemItems = await postJSON('/get-system-items', {})
    for (let k in systemItems) {
      this.sysMap[systemItems[k].uri] = (new ClientItem()).assign(systemItems[k])
    }

    // get skinny items
    let skinnyItems = await postJSON('/get-skinny-items', {})
    for (let k in skinnyItems) {
      let it = new ClientItem()
      it.assign(skinnyItems[k])
      it.contentLoaded = false
      this.map[it.uri] = it
    }

    this.setThemeHue(await this.getThemeHue())

    document.title = (await this.getLoadedItemFromURI(pageConfigs.title)).content.trim()

    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = '/' + pageConfigs.favicon;
    document.getElementsByTagName('head')[0].appendChild(link);

    this.generateTagMap()
    this.generateItemTypes()

    this.updateURI()

    this.renderer = new Renderer()
    const rootDiv = document.createElement('div')

    // render sidebar
    let sidebarElement = document.createElement('div')
    this.renderer.renderSidebar({
      title: (await this.getLoadedItemFromURI(pageConfigs.title)).content.trim(),
      subTitle: (await this.getLoadedItemFromURI(pageConfigs.subTitle)).content.trim(),
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
    bus.on('item-link-clicked', (data) => this.displayItem(resolveURI(data.emitterURI, data.targetURI)))
    bus.on('item-close-clicked', (data) => this.closeItem(data.uri))
    bus.on('item-save-clicked', (data) => this.saveItem(data))
    bus.on('item-delete-clicked', (data) => this.deleteItem(data.uri))
    bus.on('create-item-clicked', (data) => this.createItem(data))
    bus.on('search-triggered', (data) => this.processSearch(data))
    bus.on('item-saved', async (data) => {
      if (data.uri === pageConfigs.title) {
        document.title = (await this.getLoadedItemFromURI(pageConfigs.title)).content.trim()
        // ugly hack, but who cares? going through react is troublesome
        document.getElementById('site-title').innerHTML = document.title
      } else if (data.uri === pageConfigs.subTitle) {
        document.getElementById('site-subtitle').innerHTML = 
          (await this.getLoadedItemFromURI(pageConfigs.subTitle)).content.trim()
      }
    })

    this.io.on('item-change', async (data) => {
      let item: ClientItem = data.item
      item = this.map[item.uri].assign(item)
      bus.emit('item-saved', { uri: item.uri })
      const idx = this.itemFlow.indexOf(item)
      if (idx !== -1) {
        this.itemFlowDiv.children[idx].querySelector('.item-content').innerHTML = await item.html()
      }
    })
    this.io.on('item-create', (data) => {
      const item = new ClientItem()
      item.assign(data.item)
      this.map[item.uri] = item
      this.updateURI()
      bus.emit('item-saved', { uri: item.uri })
    })
    this.io.on('item-delete', async (data) => {
      const uri: string = data.uri
      await this.closeItem(uri)
      delete this.map[uri]
      this.updateURI()
      bus.emit('item-deleted')
    });

    if (window.location.hash != '') {
      this.displayItem(window.location.hash.substr(1))
    } else {
      // render default items
      (await this.getLoadedItemFromURI(defaultItemsURI)).content.split('\n').forEach(l => {
        if (l) {
          this.displayItem(l)
        }
      })
    }
  }
  
  /**
   * Get an item fron given uri, will not load it if not exist.
   */
  async getItemFromURI(uri: string): Promise<ClientItem|null> {
    const getFromMap = async (uri: string, map: URIItemMap) => {
      const possibleIndex = this.concatURI(uri, 'index')
      if (map[possibleIndex])
      return map[possibleIndex]
      if (map[uri]) {
        return map[uri]
      }
      return null
    }
    const res = await getFromMap(uri, this.map)
    if (res) {
      return res
    }
    return await getFromMap(uri, this.sysMap)
  }

  async getLoadedItemFromURI(uri: string): Promise<ClientItem|null> {
    const res = await this.getItemFromURI(uri)
    if (! res) return res
    if (! res.contentLoaded) await res.load()
    return res
  }

  generateTagMap() {
    this.tagMap = {}
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

  async displayItem(uri: string) {
    let item = await this.getLoadedItemFromURI(uri)
    if (! item) {
      console.log(`item to display [${uri}] dose not exist, creating a missing one`)
      await this.createItem({ uri: uri }, false)
      return
    }

    if (item.displaied) {
      this.scrollToItem(item)
      return
    }

    let el = document.createElement('div')
    el.className = 'item-container'
    this.renderer.renderItem(item, el)
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

  async saveItem(data: {uri: string, editedItem: Partial<ClientItem>, token?: string}) {
    let item = await this.getLoadedItemFromURI(data.uri)
    if (item === null) return

    // if (item.isSystem) {
      // item = new ClientItem()
    // }

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
    }
    if (changedKeys['title'] || changedKeys['uri']) {
      this.updateURI()
    }
    // TODO: performance issue?
    this.generateTagMap()
    item.editing = false
    item.missing = false
    const { containerDiv, parsedContent, ...itemToSave } = item
    const savedItem = await postJSON('/save-item', {
      uri: data.uri,
      item: itemToSave
    })
    assignCommonProperties(item, savedItem)
    if (data.token) bus.emit(`item-saved-${data.token}`, {item: item})
    bus.emit('item-saved', { uri: item.uri })
  }

  finalizeItemEdit(itemURI: string, rerender: boolean = true) {
    bus.emit(`external-edit-${itemURI}`, {rerender: rerender})
  }

  async createItem(data: {uri: string}, editing: boolean = true) {
    const item = new ClientItem()
    item.content = ''
    if (data.uri) item.uri = data.uri
    else item.uri = 'new-item'
    item.editing = editing
    item.missing = true
    item.headers.tags = []
    if (this.map[item.uri]) {
      let cnt = 1
      while (this.map[`${item.uri}${cnt}`]) {
        cnt += 1
      }
      item.uri = `${item.uri}${cnt}`
    }
    item.title = suggestedURIToTitle(item.uri)
    item.parsedContent = '<i>This item does not exist.</i>'
    this.map[item.uri] = item
    this.updateURI()
    this.displayItem(item.uri)
  }

  async deleteItem(uri: string) {
    await this.closeItem(uri)
    delete this.map[uri]
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
    this.URIParser.parseItemTree(Object.assign({}, this.sysMap, this.map))
  }

  setThemeHue(hue: number) {
    setPageColors(hue)
  }

  async getThemeHue(): Promise<number> {
    return RGBtoHSV(CSSColorToRGBA((await this.getLoadedItemFromURI(pageConfigs.primaryColor)).content)).h
  }

}

const manager = new ItemManager()

export default manager
