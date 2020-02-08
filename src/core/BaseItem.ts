import * as moment from 'moment'
import { MIME } from './Common'

type ItemHeader = {
  'author'?: string
  'create-time'?: moment.Moment
  'modify-time'?: moment.Moment
  'tags'?: string[]
  'uri'?: string
}

/**
 * Item is the basic compose block of Kiwi, representing a basic piece of information.
 */
abstract class BaseItem {
  /**
   * Every item has a title, this is unique under the same namespace
   */
  title: string = ''
  /**
   * The MIME type of item content, null if unknown
   * as user can have their own types, we will only maintain a compile time guarantee,
   * but not runtime.
   */
  type: MIME | null = null
  /**
   * Other metadata used to describe this item
   */
  headers: ItemHeader = {}
  /**
   * Chlid items if this item is a namespace
   */
  childs: BaseItem[] = []
  /**
   * The URI of this item
   */
  uri: string = ''
  /**
   * This item has not been created yet
   */
  missing: boolean = true

  /**
   * Is this a system item
   */
  isSystem: boolean = false

  /**
   * The raw content of this item
   */
  content: string = ''
  /**
   * Parsed content of this item, a string of HTML <div> element
   */
  parsedContent: string = ''
  /**
   * Weather the newest content has been parsed, used to avoid repeated parsing
   */
  isContentParsed: boolean = false
  /**
   * If the content is editable
   */
  isContentEditable: boolean = true

  /**
   * Return the HTML content generated, parse content if not
   */
  abstract async html(): Promise<string>

  /**
   * Return the json representation of this item (serialization), without chlids
   */
  async json(): Promise<string> {
    if (!this.isContentParsed)
      await this.html()
    const { childs, ...thisToSend } = this
    return JSON.stringify(thisToSend)
  }

}

export {
  ItemHeader,
  BaseItem
}
