import { RenderPlugin } from '../../core/Plugin'
import { ScriptApi } from '../../core/ScriptApi'
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
      filter: (all: [string, Partial<ServerItem>][]) => [string, Partial<ServerItem>][],
      kw: { ordered?: boolean; href?: any; name?: any } = {}
    ): Promise<string> => {
      const filtered = filter(Object.entries(await ScriptApi.getAllItems()))
      const result = filtered
        .map(([uri, it]) => {
          const href = kw.href ? kw.href(uri, it) : `/${uri}`
          const name = kw.name ? kw.name(uri, it) : `${it.title}`
          return `<li><a href="${href}">${name}</a></li>`
        })
        .join('\n')
      if (kw.ordered) return `<ol>${result}</ol>`
      return `<ul>${result}</ul>`
    }
  }
}
