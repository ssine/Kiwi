import * as moment from 'moment'
import { parse } from './parser'
import { MIME } from './common'

type item_header = {
  'title'?: string
  'author'?: string
  'create-time'?: moment.Moment
  'modify-time'?: moment.Moment
}

/**
 * Item is the basic compose block of Kiwi, representing a basic piece of information.
 * 
 * It's abstracted from a file, so as to be useable in both server and client side.
 */
class item {
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
  headers: item_header = {}
  /**
   * Chlid items if this item is a namespace
   */
  childs: item[] = []
  /**
   * The URI of this item
   */
  uri: string = ''

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
   * Return the HTML content generated
   */
  html() {
    if (!this.content_parsed)
      this.parse()
    return this.parsed_content
  }
  
  parse() {
    this.parsed_content = parse(this.content, this.type || 'text/markdown')
    this.content_parsed = true
  }

}

export {
  item,
  item_header
}
