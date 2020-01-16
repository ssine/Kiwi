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
  need_load: boolean = true
  need_save: boolean = false
  displaied: boolean = false
  editing: boolean = false
  html_element: Element | null = null


  /**
   * Load all the contents of current item from server
   */
  async load() {
    let obj = await postJSON('/get-item', {uri: this.uri})
    console.log(obj)
    assignCommonProperties(this, obj)
  }
  
  /**
   * Save this item back to server
   */
  async save() {
    const { html_element, ...no_html_el_this } = this
    let obj = await postJSON('/put-item', {item: no_html_el_this})
    assignCommonProperties(this, obj)
  }

  assign(obj: Object): ClientItem {
    assignCommonProperties(this, obj)
    return this
  }

  html(): string {
    return this.parsed_content
  }
}

export default ClientItem
