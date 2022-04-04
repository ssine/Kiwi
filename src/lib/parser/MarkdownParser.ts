import { Parser } from '../../core/Parser'
import { MIME, resolveURI, isURL } from '../../core/Common'
// import * as cheerio from 'cheerio'
import marked from 'marked'
import * as hljs from 'highlight.js'
// import { typesetDocumentMath } from './MathJaxParser'

// keep dollar symbols untouched for mathjax
// @ts-ignore
marked.Lexer.rules.inline.gfm.text = /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\$\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
const tokenizer = {
  codespan(src: string) {
    const match = src.match(/^((\s*\$[\s\S]+(?<!\\)\$)|(\s*\$\$[\s\S]+(?<!\\)\$\$))/g)
    if (match) {
      return {
        type: 'text',
        raw: match[0],
        text: match[0],
      }
    }
    return false
  },
}
// @ts-ignore
marked.use({ tokenizer })

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
        } catch (err) {
          return code
        }
      },
    })
  }

  parse(kwargs: { uri: string; input: string }): string {
    let html = marked(kwargs.input)
    html = html.replace(/(src|href)="(.+?)"/g, (match, $1, $2) => {
      if (isURL($2)) return match
      return `${$1}="${resolveURI(kwargs.uri, $2)}"`
    })
    return `<div>${html}</div>`
    // return `<div>${marked(typesetDocumentMath(kwargs.input))}</div>`
    // const $ = cheerio.load(marked(input))
    // $('a').addClass('item-link')
    // return $.html($('body'))
  }

  supportedTypes(): MIME[] {
    return ['text/markdown']
  }
}

export default MarkdownParser
