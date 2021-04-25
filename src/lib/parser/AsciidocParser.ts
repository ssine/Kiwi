import {Parser} from '../../core/Parser'
import {MIME} from '../../core/Common'
import Asciidoctor from 'asciidoctor'
import * as cheerio from 'cheerio'
import * as hljs from 'highlight.js'

class AsciidocParser extends Parser {
  processor: any
  init() {
    this.processor = Asciidoctor()
  }

  parse(kwargs: {input: string}): string {
    const $ = cheerio.load(this.processor.convert(kwargs.input))
    $('pre code')
      .toArray()
      .forEach(el => {
        const lang = el.attribs['data-lang']
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
