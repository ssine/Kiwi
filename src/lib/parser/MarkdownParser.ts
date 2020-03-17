import { Parser } from '../../core/Parser'
import { MIME } from '../../core/Common'
// import * as cheerio from 'cheerio'
import * as marked from 'marked'
import * as hljs from 'highlight.js'
import { typesetDocumentMath } from './MathJaxParser'

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
        if (!lang) return code
        try {
          return hljs.highlight(lang, code).value
        } catch {
          return code
        }
      }
    });
  }

  parse(kwargs: {input: string}): string {

    return `<div>${marked(typesetDocumentMath(kwargs.input))}</div>`
    // const $ = cheerio.load(marked(input))
    // $('a').addClass('item-link')
    // return $.html($('body'))  
  }

  supportedTypes(): MIME[] {
    return ['text/markdown']
  }
}

export default MarkdownParser
