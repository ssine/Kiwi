import { RenderPlugin } from '../../core/Plugin'
import manager from '../../core/ItemManager'
import { ServerItem } from '../../core/ServerItem'

export default class ListPlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['list']
  }

  getDescription() {
    return `given a filter function, return a list of items returned by filter.`
  }

  getFunctionForItem() {
    return async (
      filter: (all: Partial<ServerItem>[]) => Partial<ServerItem>[],
      kw: { ordered?: boolean; href?: any; name?: any } = {}
    ): Promise<string> => {
      const filtered = filter(manager.getSkinnyItems())
      const result = filtered
        .map(it => {
          const href = kw.href ? kw.href(it) : `/${it.uri}`
          const name = kw.name ? kw.name(it) : `${it.title}`
          return `<li><a href="${href}">${name}</a></li>`
        })
        .join('\n')
      if (kw.ordered) return `<ol>${result}</ol>`
      return `<ul>${result}</ul>`
    }
  }
}
