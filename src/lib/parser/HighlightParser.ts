import { Parser } from '../../core/Parser'
import { MIME, getLanguageFromMIME, MIMELangDict } from '../../core/Common'
import * as hljs from 'highlight.js'

/**
 * Highlight parser for code items
 */
export default class HighlightParser extends Parser {

  init() {
  }

  parse(kwargs: { input: string, uri: string, type: MIME }): string {
    const lang = getLanguageFromMIME(kwargs.type)
    let res: string = ''
    try {
      res = hljs.highlight(lang, kwargs.input).value
      console.log(lang, res)
    } catch {}
    return `<pre><code>${res}</pre></code>`
  }

  supportedTypes(): MIME[] {
    // @ts-ignore
    return Object.keys(MIMELangDict)
  }
}
