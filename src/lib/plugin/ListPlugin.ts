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
    return async (filter: (all: Partial<ServerItem>[]) => Partial<ServerItem>[], kw: { ordered?: boolean, href?: any, name?: any } = {}): Promise<string> => {
      const filtered = filter(manager.getSkinnyItems())
      let result = filtered.map(it => {
        let href = kw.href ? kw.href(it) : `/${it.uri}`
        let name = kw.name ? kw.name(it) : `${it.title}`
        return `<li><a href="${href}">${name}</a></li>`
      }
      ).join('\n')
      if (kw.ordered) return `<ol>${result}</ol>`
      return `<ul>${result}</ul>`
    }
  }
}
