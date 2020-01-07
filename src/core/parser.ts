let parser_map = new Map<string, parser>()

type parser_input = {
  content: string
  options: { [name:string]: string }
}

/**
 * @classdesc interface of all content parsers
 * 
 * They accept the raw strings whose file extension or declared type is in
 * register_info() and returns parsed html <div> block.
 * Table of content is optional
 * 
 * Provide the register api to impls later, jsut hard code it now
 */
abstract class parser {
  abstract init(): void
  abstract parse(input: parser_input): void
  abstract render_html(): string
  abstract register_info(): string[]
  register(types: string[]) {
    for (let type of types) {
      parser_map.set(type, this)
    }
  }
}


import * as marked from 'marked'

class markdown_parser extends parser {
  input: string
  constructor () {
    super()
    this.input = ''
  }
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
  parse(input: parser_input) {
    this.input = input.content
  }
  render_html() {
    return marked(this.input)
  }
  register_info() {
    return ['md']
  }
}

let md = new markdown_parser()
md.init()
md.register(md.register_info())

/**
 * @abstract parse a content and return html <div>
 */
export function parse(input: parser_input): string {
  let parser = parser_map.get(input.options['type'])
  if (!parser) return ''
  parser.parse(input)
  return parser.render_html()
}
