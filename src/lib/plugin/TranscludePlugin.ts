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
      return await it.html()
    }
  }
}
