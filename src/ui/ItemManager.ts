import bus from './eventBus'
import { defaultItemsURI } from '../boot/config'
import ClientItem from './ClientItem'
import { postJSON, getPositionToDocument } from './Common'
import Renderer from './Renderer'
import { URIParser } from './URIParser'

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

  async init() {
    // get system items
    let systemItems = await postJSON('/get-system-items', {})
    for (let k in systemItems) {
      this.map[systemItems[k].uri] = (new ClientItem()).assign(systemItems[k])
    }
    console.log(this.map[defaultItemsURI].content)
    // get skinny items
    let skinnyItems = await postJSON('/get-skinny-items', {})
    for (let k in skinnyItems) {
      console.log(k)
      let it = new ClientItem()
      it.assign(skinnyItems[k])
      it.contentLoaded = false
      this.map[it.uri] = it
    }
    this.map[defaultItemsURI].content.split('\n').forEach(l => this.displayItem(l))
    console.log(this.map[defaultItemsURI])

    this.renderer = new Renderer()
    this.URIParser.parseItemTree(this.map)

    const rootDiv = document.createElement('div')

    // render sidebar
    let sidebarElement = document.createElement('div')
    this.renderer.renderSidebar({
      title: `Sine's Wiki`,
      subTitle: `Happiness is a choice`,
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
    bus.on('item-link-clicked', (data) => this.displayItem(data.targetURI))
    bus.on('item-close-clicked', (data) => this.closeItem(data.uri))
    bus.on('item-delete-clicked', (data) => this.closeItem(data.uri))
    bus.on('create-item-clicked', (data) => this.createItem(data))
  }
  
  async getItemFromURI(uri: string): Promise<ClientItem|null> {
    console.log(uri)
    if (this.map[uri] && this.map[uri].contentLoaded)
      return this.map[uri]
    // fetch from server
    let currentItem = new ClientItem()
    currentItem.uri = uri
    await currentItem.load()
    if(currentItem.title === '') return null
    this.map[uri] = currentItem
    return currentItem
  }

  scrollToItem(it: ClientItem) {
    const pos = getPositionToDocument(it.containerDiv)
    scrollTo(pos.left, pos.top)
  }

  async displayItem(uri: string) {
    console.log(uri)
    let item = await this.getItemFromURI(uri)

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

  async createItem(data: {uri: string}) {
    const item = new ClientItem()
    item.title = 'New Item'
    item.content = ''
    if (data.uri) item.uri = data.uri
    else item.uri = 'new-item'
    item.editing = true
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
    
  }

  updateURI() {
    this.URIParser.parseItemTree(this.map)
  }

}

const manager = new ItemManager()

export default manager
