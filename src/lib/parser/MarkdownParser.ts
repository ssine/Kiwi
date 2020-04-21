import { Parser } from '../../core/Parser'
import { MIME } from '../../core/Common'
// import * as cheerio from 'cheerio'
import * as marked from 'marked'
import * as hljs from 'highlight.js'
// import { typesetDocumentMath } from './MathJaxParser'

// @ts-ignore
marked.Lexer.rules.inline.gfm.text = /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\$\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
const tokenizer = {
  codespan(src: string) {
    const match = src.match(/^((\s*\$[\s\S]+(?<!\\)\$)|(\s*\$\$[\s\S]+(?<!\\)\$\$))/g);
    if (match) {
      return {
        type: 'text',
        raw: match[0],
        text: match[0]
      };
    }
    return false;
  }
};
// @ts-ignore
marked.use({ tokenizer });

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

    return `<div>${marked(kwargs.input)}</div>`
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
