import { resolveURI } from '../../core/Common'
import { ItemManager } from '../../core/ItemManager'
import { RenderPlugin } from '../../core/Plugin'

export default class TranscludePlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['transclude', 'tc']
  }

  getFunctionForItem(uri: string) {
    return async (input: string): Promise<string> => {
      const targetURI = resolveURI(uri, input.trim())
      if (targetURI === uri) {
        return 'direct cyclic transclude detected!'
      }
      const it = await ItemManager.getInstance().getItem(targetURI, '')
      if (!it) return "Item to transclude doesn't exist!"
      return it.content || ''
    }
  }
}
