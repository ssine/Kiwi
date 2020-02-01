import { MIME } from './Common'
import { getLogger } from './Log'
import * as he from 'he'

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
    }
  }
}

const forEachPiece = function forEachPieceOfString(
  input: string,
  patt: RegExp,
  matched: (s: string) => void,
  unmatched: (s: string) => void) {
  let match: RegExpExecArray | null = null
  let lastIndex = 0
  while (true) {
    match = patt.exec(input)
    if (!match) {
      unmatched(input.slice(lastIndex))
      break
    }
    unmatched(input.slice(lastIndex, match.index))
    matched(match[0])
    lastIndex = match.index + match[0].length
  }
}

const excludeReg = /<pre>[\s\S]*?<\/pre>/igm
const macroReg = /\{\{[\s\S]*?\}\}/gm

/**
 * Parse a content and return html <div>
 */
const parse = function parse(input: string, type: MIME): string {
  const parser = parserMap.get(type)
  if (!parser) {
    logger.info(`Parser for type ${type} not found, empty string returned.`)
    return ''
  }
  let html = parser.parse(input)
  let processed = ''
  let global: any = {}
  global.eval = eval
  forEachPiece(html, excludeReg,
    (s) => { processed += s },
    (s) => { forEachPiece(s, macroReg,
      (s) => {
        logger.info(`eval macro call ${he.decode(s).slice(2, -2)}`)
        try {
          if (/d[\s]/.test(s.slice(2, 4))) global.eval(he.decode(s).slice(3, -2))
          else processed += global.eval(he.decode(s).slice(2, -2))
        } catch (err) {
          processed += err
        }
      },
      (s) => { processed += s }
    )}
  )
  return processed
}

export {
  Parser,
  parse,
}
