import { Parser } from './Parser'
import { MIME } from './Common'
// import * as cheerio from 'cheerio'
import * as marked from 'marked'
import * as hljs from 'highlight.js'

class MarkdownParser extends Parser {

  init() {
    marked.setOptions({
      renderer: new marked.Renderer(),
      pedantic: false,
      gfm: true,
      breaks: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false,
      highlight: (code, lang, callback) => {
        try {
          return hljs.highlight(lang, code).value
        } catch {
          return code
        }
      }
    });
  }

  parse(input: string): string {
    return `<div>${marked(input)}</div>`
    // const $ = cheerio.load(marked(input))
    // $('a').addClass('item-link')
    // return $.html($('body'))  
  }

  supportedTypes(): MIME[] {
    return ['text/markdown']
  }
}

export default MarkdownParser
