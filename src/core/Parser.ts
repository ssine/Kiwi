import { MIME } from './MimeType'
import { getLogger } from './Log'
import { state } from './state'
import { runInAction } from 'mobx'

const logger = getLogger('parser')

/**
 * Interface of all content parsers
 *
 * They accept the raw strings whose file extension or declared type is in
 * `supported_types()` and returns parsed html `<div>` block.
 *
 * @todo support for table of contents
 * @todo Provide the register api to impls later, just hard code it now
 */
export abstract class Parser {
  /**
   * Initialize the parser
   */
  abstract init(): void
  /**
   * Parse input into HTML `<div>` block.
   */
  abstract parse(kwargs: { input: string; uri: string }): string
  /**
   * A list of supported content type in MIME format
   */
  abstract supportedTypes(): MIME[]

  /**
   * Ask to be called on content with supported types
   */
  register() {
    runInAction(() => {
      for (const type of this.supportedTypes()) {
        state.parserMap.set(type, this)
        logger.debug(`Parser for type ${type} registered.`)
      }
    })
  }
}

/**
 * Parse a content and return html <div>
 */
export const parse = function parse(kwargs: { input: string; uri: string; type: MIME }): string {
  const parser = state.parserMap.get(kwargs.type)
  if (!parser) {
    logger.info(`Parser for type ${kwargs.type} not found, empty string returned.`)
    return ''
  }
  return parser.parse(kwargs)
}

export const htmlPostProcess = async (html: string): Promise<string> => {
  // TODO: unify html post processing
  return html
}
