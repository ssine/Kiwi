/**
 * Important Note: Support for parsing wikitext to html is very limited.
 * basic blocks (font, link, lists) works fine, but lists are out-of-order,
 * see [this](https://github.com/spencermountain/wtf_wikipedia/issues/88).
 * @packageDocumentation
 */

import { Parser } from '../../core/Parser'
import { MIME } from '../../core/MimeType'
// @ts-ignore (es6 import gets the namespace, sign)
// const wtf = require('wtf_wikipedia')
import wtf from 'wtf_wikipedia'
import * as cheerio from 'cheerio'
wtf.extend(require('wtf-plugin-html'))

class WikitextParser extends Parser {
  init() {}

  parse(kwargs: { input: string }): string {
    // @ts-ignore
    const $ = cheerio.load(wtf(kwargs.input).html())
    return `<div>${$('body').html()}</div>`
  }

  supportedTypes(): MIME[] {
    return ['text/wikitext']
  }
}

export default WikitextParser
