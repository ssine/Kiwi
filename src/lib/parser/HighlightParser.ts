import { Parser } from '../../core/Parser'
import * as hljs from 'highlight.js'
import { MIME, getMonacoLangFromType } from '../../core/MimeType'

/**
 * Highlight parser for code items
 */
export default class HighlightParser extends Parser {
  init() {}

  parse(kwargs: { input: string; uri: string; type: MIME }): string {
    const lang = getMonacoLangFromType(kwargs.type) || ''
    let res = ''
    try {
      res = hljs.highlight(lang, kwargs.input).value
    } catch (err) {}
    return `<pre><code>${res}</pre></code>`
  }

  supportedTypes(): MIME[] {
    return [
      'application/json',
      'text/yaml',
      'text/x-c',
      'text/x-cpp',
      'text/css',
      'text/x-python',
      'text/x-java',
      'text/javascript',
      'text/x-typescript',
    ]
  }
}
