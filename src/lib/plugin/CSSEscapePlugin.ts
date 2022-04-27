import { RenderPlugin } from '../../core/plugin'
import cssesc from 'cssesc'

export default class CSSEscapePlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['cssesc', 'CSSEscape']
  }

  getDescription() {
    return `escape give string to be a valid css identifier.`
  }

  getFunctionForItem() {
    return async (src: string): Promise<string> => {
      return cssesc(src, { isIdentifier: true })
    }
  }
}
