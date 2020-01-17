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
   * The parser is also responsible for recognizing local links in <a> tag and
   * adding class '.item-link'
   */
  abstract parse(input: string): string
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
      logger.info(`Parser for type ${type} registered.`)
      console.log(parserMap.get('text/markdown'))
    }
  }
}

/**
 * Parse a content and return html <div>
 */
const parse = function parse(input: string, type: MIME): string {
  let parser = parserMap.get(type)
  console.log(parserMap.get('text/markdown'))
  if (!parser) {
    logger.info(`Parser for type ${type} not found, empty string returned.`)
    return ''
  }
  return parser.parse(input)
}

export {
  Parser,
  parse,
}
