import { RenderPlugin } from '../../core/Plugin'
import manager from '../../core/ItemManager'

export default class ImportPlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['import']
  }

  getFunctionForItem() {
    return async (input: string): Promise<string> => {
      return 'import plugin not yet implemented.'
    }
  }
}
