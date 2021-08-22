{{d

enum NodeType {
  Person = 'person',
  Organization = 'organization',
}

enum EdgeType {
  Directed = 'directed',
  Undirected = 'undirected',
}

type Node = {
  uri: string
  name: string
  type: NodeType
  meta: any
}

type Edge = {
  type: EdgeType
  uri: string
  from: string
  to: string
  labels: string[]
  meta: any
}

let getData: (prefix: string) => Promise<{ nodes: Node[]; edges: Edge[] }>
let getGraph: (prefix: string) => Promise<string>
;(() => {
  type ItemState = {
    person: Record<string, any>
    org: Record<string, any>
    relationship: Record<string, any>
  }

  const getItemState = async (prefix: string): Promise<ItemState> => {
    const allItems = await kiwi.getAllItems()
    // return JSON.stringify(Object.entries(allItems).slice(0, 3).map(i => i[0]))
    const personMatchStr = `${prefix}/person/`
    const orgMatchStr = `${prefix}/organization/`
    const relMatchStr = `${prefix}/relationship/`
    const person = Object.fromEntries(
      Object.entries(allItems)
        .filter(([uri, item]) => uri.startsWith(personMatchStr) && uri.length > personMatchStr.length)
        .map(([uri, item]) => [uri.substr(personMatchStr.length), { name: item.title, ...item.header }])
    )
    const org = Object.fromEntries(
      Object.entries(allItems)
        .filter(([uri, item]) => uri.startsWith(orgMatchStr) && uri.length > orgMatchStr.length)
        .map(([uri, item]) => [uri.substr(orgMatchStr.length), { name: item.title, ...item.header }])
    )
    const relationship = Object.fromEntries(
      Object.entries(allItems)
        .filter(([uri, item]) => uri.startsWith(relMatchStr) && uri.length > relMatchStr.length)
        .map(([uri, item]) => [uri.substr(relMatchStr.length), item.header])
    )
    return { person, org, relationship }
  }

  getData = async (prefix: string): Promise<{ nodes: Node[]; edges: Edge[] }> => {
    const data = await getItemState(prefix)

    const nodes: Node[] = []
    const edges: Edge[] = []

    // process person nodes
    for (let [uri, meta] of Object.entries(data.person)) {
      nodes.push({
        uri: uri,
        name: meta.name || uri,
        type: NodeType.Person,
        meta: meta,
      })
    }

    // process organization nodes
    for (let [fullUri, meta] of Object.entries(data.org)) {
      const uris = fullUri.split('/')
      let prev = null
      uris.forEach((uri, idx) => {
        const currentUri = uris.slice(0, idx + 1).join('/')
        const node = {
          uri: currentUri,
          name: uri,
          type: NodeType.Organization,
          meta: {},
        }
        if (idx === uris.length - 1) {
          // meta belongs to the last child
          node.name = meta.name || node.name
          node.meta = meta
        }

        const existingIdx = nodes.findIndex(n => n.type === NodeType.Organization && n.uri === currentUri)
        if (existingIdx === -1) {
          nodes.push(node)
        } else if (idx === uris.length - 1) {
          nodes[existingIdx] = node
        }

        // connect to parent
        if (!!prev && edges.filter(e => e.from === prev.uri && e.to === node.uri).length === 0) {
          edges.push({
            type: EdgeType.Directed,
            from: prev.uri,
            to: node.uri,
            uri: `[${prev.uri}]-[${node.uri}]`,
            labels: [],
            meta: {},
          })
        }
        prev = node
      })
    }

    const addEdgeLabels = (origin: string[], newLabel: string | string[] | undefined): string[] => {
      if (!newLabel) return origin
      const labels = Array.isArray(newLabel) ? newLabel : [newLabel]
      return origin.concat(labels.filter(l => !(l in origin)))
    }
    type EdgeStem = { type: EdgeType; from: string; to: string }
    const edgeEqual = (a: EdgeStem, b: EdgeStem): boolean => {
      if (a.type !== b.type) return false
      if (a.type === EdgeType.Directed) return a.from === b.from && a.to === b.to
      return (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from)
    }
    const getNode = (uri: string): Node => {
      return nodes.filter(node => node.uri === uri)[0]
    }

    // process relationships
    for (let [uri, meta] of Object.entries(data.relationship)) {
      const matchRes = /\[(.+?)\]-\[(.+?)\]/.exec(uri)
      if (!matchRes) {
        console.log(`uri ${uri} is invalid as an edge`)
        continue
      }
      const [from, to] = [matchRes[1], matchRes[2]]

      // create nodes of edge if not exist
      if (!getNode(from)) {
        nodes.push({
          uri: from,
          name: from,
          type: NodeType.Person,
          meta: {},
        })
      }
      if (!getNode(to)) {
        nodes.push({
          uri: to,
          name: to,
          type: NodeType.Person,
          meta: {},
        })
      }

      if (meta.from) {
        // edge: from <- to
        const idx = edges.findIndex(e => edgeEqual(e, { type: EdgeType.Directed, from: to, to: from }))
        if (idx === -1) {
          edges.push({
            type: EdgeType.Directed,
            from: to,
            to: from,
            uri: uri,
            labels: addEdgeLabels([], meta.from),
            meta: {},
          })
        } else {
          edges[idx].labels = addEdgeLabels(edges[idx].labels, meta.from)
        }
      }
      if (meta.to) {
        // edge: from -> to
        const idx = edges.findIndex(e => edgeEqual(e, { type: EdgeType.Directed, from: from, to: to }))
        if (idx === -1) {
          edges.push({
            type: EdgeType.Directed,
            from: from,
            to: to,
            uri: uri,
            labels: addEdgeLabels([], meta.to),
            meta: {},
          })
        } else {
          edges[idx].labels = addEdgeLabels(edges[idx].labels, meta.to)
        }
      }
      if (meta.both) {
        // edge: from -- to
        const idx = edges.findIndex(e => edgeEqual(e, { type: EdgeType.Undirected, from: from, to: to }))
        if (idx === -1) {
          edges.push({
            type: EdgeType.Undirected,
            from: from,
            to: to,
            uri: uri,
            labels: addEdgeLabels([], meta.both),
            meta: {},
          })
        } else {
          edges[idx].labels = addEdgeLabels(edges[idx].labels, meta.to)
        }
      }
    }

    // make organization rank higher than person in undirected person - organization edges
    edges.forEach(edge => {
      if (edge.type === EdgeType.Undirected && getNode(edge.to).type === NodeType.Organization) {
        const tmp = edge.from
        edge.from = edge.to
        edge.to = tmp
      }
    })

    return { nodes, edges }
  }

  getGraph = async (prefix: string): Promise<string> => {
    const { nodes, edges } = await getData(prefix)
    const shapeMap: Record<NodeType, string> = {
      [NodeType.Organization]: 'box',
      [NodeType.Person]: 'ellipse',
    }

    let str = 'digraph {\n'
    const printProps = (props: Record<string, string>) => {
      return Object.entries(props)
        .map(e => `${e[0]} = ${e[1]}`)
        .join(', ')
    }
    nodes.forEach(node => {
      const properties: Record<string, string> = {
        shape: shapeMap[node.type],
        href: `"${prefix}/${node.type}/${node.uri}"`,
      }
      if (node.name) {
        properties.label = `"${node.name}"`
      }
      str += `"${node.uri}" [${printProps(properties)}]\n`
    })
    edges.forEach(edge => {
      const properties: Record<string, string> = {
        href: `"${prefix}/relationship/${edge.uri}"`,
      }
      if (edge.type === EdgeType.Undirected) {
        properties.dir = 'none'
      }
      if (edge.labels.length > 0) {
        properties.label = `"${edge.labels.join(',')}"`
      }
      str += `"${edge.from}" -> "${edge.to}" [${printProps(properties)}]\n`
    })
    str += '}'
    return graphviz(str)
  }
})()

}}