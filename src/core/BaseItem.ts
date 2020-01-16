import * as moment from 'moment'
import { MIME } from './Common'

type ItemHeader = {
  'title'?: string
  'author'?: string
  'create-time'?: moment.Moment
  'modify-time'?: moment.Moment
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
   * The raw content of this item
   */
  content: string = ''
  /**
   * Parsed content of this item, a string of HTML <div> element
   */
  parsed_content: string = ''
  /**
   * Weather the newest content has been parsed, used to avoid repeated parsing
   */
  content_parsed: boolean = false

  /**
   * Return the HTML content generated, parse content if not
   */
  abstract html(): string

  /**
   * Return the json representation of this item (serialization), without chlids
   */
  json(): string {
    if (!this.content_parsed)
      this.html()
    return JSON.stringify(this)
  }

}

export {
  ItemHeader,
  BaseItem
}
