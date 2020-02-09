import { RenderPlugin } from '../../core/Plugin'
import manager from '../../core/ItemManager'

export default class TranscludePlugin extends RenderPlugin {
  init() {
  }

  getNames() {
    return ['transclude', 'tc']
  }

  getFunction() {
    return async (input: string): Promise<string> => {
      const it = manager.getItem(input.trim())
      if (!it) return `Item to transclude doesn't exist!`
      return await it.html()
    }
  }
}
