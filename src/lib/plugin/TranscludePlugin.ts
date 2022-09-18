import { resolveURI } from '../../core/Common'
import { transformUUID } from '../../core/ItemManager'
import { RenderPlugin } from '../../core/plugin'
import { renderItem } from '../../core/render'
import { ScriptApi } from '../../core/ScriptApi'

export default class TranscludePlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['transclude', 'tc']
  }

  getFunctionForItem(uri: string) {
    return async (input: string): Promise<string> => {
      const targetURI = resolveURI(uri, transformUUID(input.trim(), { prependSlash: true }))
      if (targetURI === uri) {
        return 'direct cyclic transclude detected!'
      }
      const it = await ScriptApi.getItem(targetURI)
      if (!it) return "Item to transclude doesn't exist!"
      return renderItem(targetURI, it)
    }
  }
}
