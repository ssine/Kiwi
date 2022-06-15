import { Parser } from '../../core/Parser'
import { resolveURI, isURL } from '../../core/Common'
import { MIME } from '../../core/MimeType'
import * as cheerio from 'cheerio'
import { marked } from 'marked'
import * as hljs from 'highlight.js'
// import { typesetDocumentMath } from './MathJaxParser'

// keep dollar symbols untouched for mathjax
// @ts-ignore
marked.Lexer.rules.inline.gfm.text =
  /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\$\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
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
    // resolve relative links
    html = html.replace(/(src|href)="(.+?)"/g, (match, $1, $2) => {
      if (isURL($2)) return match
      return `${$1}="${resolveURI(kwargs.uri, $2)}"`
    })
    const $ = cheerio.load(html)
    // @ts-ignore
    $('embed,img,video,audio').attr('src', (i: number, src: string) => {
      if (isURL(src)) return src
      return `/raw/${src}`
    })
    return $.html($('body'))
  }

  supportedTypes(): MIME[] {
    return ['text/markdown']
  }
}

export default MarkdownParser
