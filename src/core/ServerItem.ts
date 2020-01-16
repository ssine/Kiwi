import { BaseItem } from './BaseItem'
import { parse } from './Parser'
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

  html() {
    if (!this.content_parsed) {
      this.parsed_content = parse(this.content, this.type || 'text/markdown')
      this.content_parsed = true
    }
    return this.parsed_content
  }
}

export {
  ServerItem
}
