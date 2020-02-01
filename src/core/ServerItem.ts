import { BaseItem } from './BaseItem'
import { parse } from './Parser'
import { processRenderPlugin } from './Plugin'
import { FSNode } from './FileSynchronizer'

/**
 * Server Side Item Class
 */
class ServerItem extends BaseItem {

  childs: ServerItem[] = []
  /**
   * The absolute path of this item on local filesystem
   */
  fnode: FSNode | null = null

  async html() {
    if (!this.isContentParsed) {
      const html = parse(this.content, this.type || 'text/markdown')
      this.parsedContent = await processRenderPlugin(this.uri, html)
      this.isContentParsed = true
    }
    return this.parsedContent
  }
}

export {
  ServerItem
}
