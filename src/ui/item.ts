/**
 * Client Side Item
 * 
 * Provide function to sync with server items.
 * 
 * @packageDocumentation
 */

import { item } from '../core/item'
import { assign_target_properties } from '../core/common'
import { post_json } from './common'

/**
 * A client side item can have everything empty except its uri
 */
class client_item extends item {
  need_load: boolean = true
  need_save: boolean = false
  displaied: boolean = false
  editing: boolean = false
  html_element: Element | null = null


  /**
   * Load all the contents of current item from server
   */
  async load() {
    let obj = await post_json('/get_item', {uri: this.uri})
    assign_target_properties(this, obj)
  }
  
  /**
   * Save this item back to server
   */
  async save() {
    const { html_element, ...no_html_el_this } = this
    let obj = await post_json('/put_item', {item: no_html_el_this})
    assign_target_properties(this, obj)
  }

  assign(obj: Object): client_item {
    assign_target_properties(this, obj)
    return this
  }

  html(): string {
    return this.parsed_content
  }
}

export {
  client_item
}
