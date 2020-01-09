/**
 * Client Side Item
 * 
 * Provide function to sync with server items.
 * 
 * @packageDocumentation
 */

import { item } from '../../core/item_base'
import { post_json } from './common'

/**
 * A client side item can have everything empty except its uri
 */
class client_item extends item {
  need_load: boolean
  need_save: boolean

  /**
   * Load all the contents of current item from server
   */
  async load() {
    let obj = await post_json('/get_item', {uri: this.uri})
    this.parsed_content = obj.parsed_content
  }

  html(): string {
    return this.parsed_content
  }
}

export {
  client_item
}
