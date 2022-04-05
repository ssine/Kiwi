import { Parser } from '../../core/Parser'
import { MIME } from '../../core/MimeType'
import escapeHTML from 'escape-html'

class PlaintextParser extends Parser {
  init() {}

  parse(kwargs: { input: string }): string {
    return `<pre>${escapeHTML(kwargs.input)}</pre>`
  }

  supportedTypes(): MIME[] {
    return ['text/plain']
  }
}

export default PlaintextParser
