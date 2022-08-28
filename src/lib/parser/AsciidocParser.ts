import { Parser } from '../../core/Parser'
import { MIME } from '../../core/MimeType'
import Asciidoctor from 'asciidoctor'
import * as cheerio from 'cheerio'
import * as hljs from 'highlight.js'

class AsciidocParser extends Parser {
  processor!: ReturnType<typeof Asciidoctor>
  init() {
    this.processor = Asciidoctor()
  }

  parse(kwargs: { input: string }): string {
    const html = this.processor
      .convert(kwargs.input, {
        doctype: 'book',
      })
      .toString()
    const $ = cheerio.load(html)
    $('pre code')
      .toArray()
      .forEach(el => {
        const lang = el.attribs['data-lang']
        // @ts-ignore
        let code = el.children[0].data
        if (!code) return
        try {
          code = hljs.highlight(lang, code).value
        } catch (err) {}
        $(el).html(code)
      })
    return `<div>${$('body').html()}</div>`
  }

  supportedTypes(): MIME[] {
    return ['text/asciidoc']
  }
}

export default AsciidocParser
