import {RenderPlugin} from '../../core/Plugin'

export default class SVGPlugin extends RenderPlugin {
  init() {}

  getNames() {
    return ['svg']
  }

  getDescription() {
    return `give source url and a optional width of a svg, return the html to embed it.`
  }

  getFunctionForItem() {
    return async (src: string, width?: string | number): Promise<string> => {
      if (typeof width === 'string' && width[width.length - 1] === '%')
        return `<center><embed src="${src}" style="width:${width};max-width:100%;" type="image/svg+xml" /></center>`
      return `<center><embed src="${src}" style="width:${width}px;max-width:100%;" type="image/svg+xml" /></center>`
    }
  }
}
