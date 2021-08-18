import { Parser } from '../../core/Parser'
import { MIME } from '../../core/Common'

class PlaintextParser extends Parser {
  init() {}

  parse(kwargs: { input: string }): string {
    return `<pre>${kwargs.input}</pre>`
  }

  supportedTypes(): MIME[] {
    return ['text/plain']
  }
}

export default PlaintextParser
