import * as cheerio from 'cheerio'
import { MIME } from './common'

/**
 * Map recording all registered parsers
 */
let parser_map = new Map<MIME, parser>()

/**
 * Interface of all content parsers
 * 
 * They accept the raw strings whose file extension or declared type is in
 * `supported_types()` and returns parsed html `<div>` block.
 * 
 * @todo support for table of contents
 * @todo Provide the register api to impls later, jsut hard code it now
 */
abstract class parser {
  /**
   * Initialize the parser
   */
  abstract init(): void
  /**
   * Parse input into HTML `<div>` block.
   * The parser is also responsible for recognizing local links in <a> tag and
   * adding class '.item-link'
   */
  abstract parse(input: string): string
  /**
   * A list of supported content type in MIME format
   */
  abstract supported_types(): MIME[]

  /**
   * Ask to be called on content with supported types
   */
  register(types: MIME[]) {
    for (let type of types) {
      parser_map.set(type, this)
    }
  }
}


import * as marked from 'marked'

class markdown_parser extends parser {

  init() {
    marked.setOptions({
      renderer: new marked.Renderer(),
      pedantic: false,
      gfm: true,
      breaks: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false
    });
  }

  parse(input: string): string {
    const $ = cheerio.load(marked(input))
    $('a').addClass('item-link')
    return $.html($('body'))  
  }

  supported_types(): MIME[] {
    return ['text/markdown']
  }
}


let md = new markdown_parser()
md.init()
md.register(md.supported_types())

/**
 * Parse a content and return html <div>
 */
function parse(input: string, type: MIME): string {
  let parser = parser_map.get(type)
  if (!parser) return ''
  return parser.parse(input)
}

export {
  parse
}
