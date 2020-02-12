import { resolveURI } from '../../core/Common'
import { RenderPlugin } from '../../core/Plugin'
import manager from '../../core/ItemManager'

export default class TranscludePlugin extends RenderPlugin {
  init() {
  }

  getNames() {
    return ['transclude', 'tc']
  }

  getFunctionForItem(uri: string) {
    return async (input: string): Promise<string> => {
      const targetURI = resolveURI(uri, input.trim())
      if (targetURI === uri) {
        return 'direct circle transclude detected!'
      }
      const it = manager.getItem(targetURI)
      if (!it) return `Item to transclude doesn't exist!`
      return await it.html()
    }
  }
}
