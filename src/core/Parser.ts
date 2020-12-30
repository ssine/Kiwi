import { MIME } from './Common'
import { getLogger } from './Log'

const logger = getLogger('parser')

/**
 * Map recording all registered parsers
 */
const parserMap = new Map<MIME, Parser>()

/**
 * Interface of all content parsers
 * 
 * They accept the raw strings whose file extension or declared type is in
 * `supported_types()` and returns parsed html `<div>` block.
 * 
 * @todo support for table of contents
 * @todo Provide the register api to impls later, jsut hard code it now
 */
abstract class Parser {
  /**
   * Initialize the parser
   */
  abstract init(): void
  /**
   * Parse input into HTML `<div>` block.
   */
  abstract parse(kwargs: { input: string, uri: string }): string
  /**
   * A list of supported content type in MIME format
   */
  abstract supportedTypes(): MIME[]

  /**
   * Ask to be called on content with supported types
   */
  register() {
    for (const type of this.supportedTypes()) {
      parserMap.set(type, this)
      logger.debug(`Parser for type ${type} registered.`)
    }
  }
}

/**
 * Parse a content and return html <div>
 */
const parse = function parse(kwargs: { input: string, uri: string, type: MIME }): string {
  const parser = parserMap.get(kwargs.type)
  if (!parser) {
    logger.info(`Parser for type ${kwargs.type} not found, empty string returned.`)
    return ''
  }
  return parser.parse(kwargs)
}

export {
  Parser,
  parse,
}
