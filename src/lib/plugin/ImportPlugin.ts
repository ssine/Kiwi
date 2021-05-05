import { RenderPlugin } from '../../core/Plugin'

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
