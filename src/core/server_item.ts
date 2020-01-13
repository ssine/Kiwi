import { item } from './item'
import { parse } from './parser'
import { fs_node } from './file'
/**
 * Server Side Item Class
 */
class server_item extends item {
  childs: server_item[] = []
  /**
   * The absolute path of this item on local filesystem
   */
  fnode: fs_node | null = null

  html() {
    if (!this.content_parsed) {
      this.parsed_content = parse(this.content, this.type || 'text/markdown')
      this.content_parsed = true
    }
    return this.parsed_content
  }
}

export {
  server_item
}
