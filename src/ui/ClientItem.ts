/**
 * Client Side Item
 * 
 * Provide function to sync with server items.
 * 
 * @packageDocumentation
 */

import { BaseItem } from '../core/BaseItem'
import { assignCommonProperties } from '../core/Common'
import { postJSON } from './Common'

/**
 * A client side item can have everything empty except its uri
 */
class ClientItem extends BaseItem {
  contentLoaded: boolean = true
  needSave: boolean = false
  displaied: boolean = false
  editing: boolean = false
  containerDiv: Element | null = null
  childs: ClientItem[]


  /**
   * Load all the contents of current item from server
   */
  async load() {
    let obj = await postJSON('/get-item', {uri: this.uri})
    assignCommonProperties(this, obj)
  }
  
  /**
   * Save this item back to server
   */
  async save() {
    const { containerDiv, ...itemToSave } = this
    let obj = await postJSON('/put-item', {item: itemToSave})
    assignCommonProperties(this, obj)
  }

  assign(obj: Object): ClientItem {
    assignCommonProperties(this, obj)
    return this
  }

  html(): string {
    return this.parsedContent
  }
}

export default ClientItem
