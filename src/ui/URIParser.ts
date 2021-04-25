import ClientItem from './ClientItem'

class URINode {
  URI: string
  title: string
  absoluteURI: string
  childs: URINode[]
  level: number

  constructor(URI: string, title: string) {
    this.URI = URI
    this.title = title
    this.absoluteURI = ''
    this.childs = []
    this.level = 0
  }
}

class URIParser {
  rootNode: URINode = new URINode('/', '/')

  /**
   * Given a map of all items, construct a hierachical tree of URIs.
   */
  parseItemTree(items: Record<string, ClientItem>) {
    this.rootNode.childs = []

    // TODO: performance issue, consider changing algorithm
    const traverse = (uris: string[]): URINode => {
      let cur_node = this.rootNode

      for (const [idx, uri] of uris.entries()) {
        if (uri === '') continue
        let found = false
        for (const nd of cur_node.childs) {
          if (nd.URI === uri) {
            found = true
            cur_node = nd
            break
          }
        }
        if (!found) {
          const nx = new URINode(uri, uri)
          nx.absoluteURI = uris.slice(0, idx + 1).join('/')
          cur_node.childs.push(nx)
          cur_node = nx
        }
      }

      return cur_node
    }

    for (const key in items) {
      const it = items[key]
      const nd = traverse(it.uri.split('/'))
      nd.title = it.title || it.uri
      nd.absoluteURI = it.uri
    }
  }
}

export {URINode, URIParser}
