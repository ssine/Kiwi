import ClientItem from './ClientItem'

class URINode {
  URI: string
  title: string
  absoluteURI: string
  childs: URINode[]

  constructor(URI: string, title: string) {
    this.URI = URI
    this.title = title
    this,this.absoluteURI = ''
    this.childs = []
  }
}

class URIParser {
  rootNode: URINode | null = null

  /**
   * Given a map of all items, construct a hierachical tree of URIs.
   */
  parseItemTree(items: Record<string, ClientItem>) {
    this.rootNode = new URINode('/', '/')

    // TODO: performance issue, consider changing algorithm
    const traverse = (uris: string[]): URINode => {
      let cur_node = this.rootNode

      for (const uri of uris) {
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
          cur_node.childs.push(nx)
          cur_node = nx
        }
      }

      return cur_node
    }

    for (let key in items) {
      const it = items[key]
      const nd = traverse(it.uri.split('/'))
      nd.title = it.title
      nd.absoluteURI = it.uri
    }
  }

}

export {
  URINode,
  URIParser
}