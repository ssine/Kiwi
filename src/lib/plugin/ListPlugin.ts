import { RenderPlugin } from '../../core/Plugin'
import manager from '../../core/ItemManager'
import { ServerItem } from '../../core/ServerItem'

export default class ListPlugin extends RenderPlugin {
  init() {
  }

  getNames() {
    return ['list']
  }

  getDescription() {
    return `given a filter function, return a list of items returned by filter.`
  }

  getFunctionForItem() {
    return async (filter: (all: Partial<ServerItem>[]) => Partial<ServerItem>[], ordered: boolean = false): Promise<string> => {
      const filtered = filter(manager.getSkinnyItems())
      let result = filtered.map(it => `<li><a href="${it.uri}">${it.title}</a></li>`).join('\n')
      if (ordered) return `<ol>${result}</ol>`
      return `<ul>${result}</ul>`
    }
  }
}
