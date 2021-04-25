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
  contentLoaded = false
  displaied = false
  editing = false
  containerDiv: Element | null = null

  /**
   * Load all the contents of current item from server
   */
  async load() {
    const obj = await postJSON('/get-item', { uri: this.uri })
    assignCommonProperties(this, obj)
    this.contentLoaded = true
  }

  /**
   * Save this item back to server
   */
  async save() {
    const { containerDiv, parsedContent, ...itemToSave } = this
    const obj = await postJSON('/save-item', { uri: this.uri, item: itemToSave })
    assignCommonProperties(this, obj)
  }

  assign(obj: Object): ClientItem {
    assignCommonProperties(this, obj)
    return this
  }

  async html(): Promise<string> {
    return this.parsedContent
  }
}

export default ClientItem
