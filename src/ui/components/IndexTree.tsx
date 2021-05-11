import './IndexTree.css'
import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { getEmPixels } from '../Common'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'

const manager = ItemManager.getInstance()

type NodeState = {
  uri: string
  expand: boolean
  childs: NodeState[]
}

const INDENT_WIDTH = 15

// TODO: update tree on items change
export const IndexTree = () => {
  const [root, setRoot] = useState(
    generateNodeState(Object.keys(Object.assign({}, manager.systemItems, manager.items)))
  )

  console.log(root)

  const _renderTree = (node: NodeState, level: number): JSX.Element[] => {
    let nodeList = []
    const curNode =
      Object.keys(node.childs).length > 0 ? (
        <div
          key={node.uri}
          className="kiwi-indextree-item"
          style={{ paddingLeft: INDENT_WIDTH * level }}
          onClick={_ => {
            eventBus.emit('item-link-clicked', {
              targetURI: node.uri,
            })
          }}
        >
          <div
            className={`kiwi-indextree-foldicon ms-Icon ms-Icon--${node.expand ? 'ChevronDown' : 'ChevronRight'}`}
            onClick={ev => {
              node.expand = !node.expand
              setRoot({
                ...root,
              })
              ev.stopPropagation()
            }}
          ></div>
          {manager.getItem(node.uri) ? manager.getItem(node.uri).title : node.uri.split('/').pop()}
        </div>
      ) : (
        <div
          key={node.uri}
          className="kiwi-indextree-item"
          style={{ paddingLeft: INDENT_WIDTH * level + getEmPixels() * 1.4 }}
          onClick={_ => {
            eventBus.emit('item-link-clicked', {
              targetURI: node.uri,
            })
          }}
        >
          {manager.getItem(node.uri) ? manager.getItem(node.uri).title : node.uri.split('/').pop()}
        </div>
      )

    nodeList.push(curNode)
    if (Object.keys(node.childs).length > 0 && node.expand) {
      nodeList = nodeList.concat(
        Object.keys(node.childs).map((uri, idx) => {
          return _renderTree(node.childs[idx], level + 1)
        })
      )
    }

    return nodeList
  }

  return <div className="kiwi-tree-list">{_renderTree(root, -1).slice(1)}</div>
}

const generateNodeState = (uris: string[]): NodeState => {
  const root: NodeState = {
    uri: '/',
    expand: true,
    childs: [],
  }

  const traverse = (segments: string[]): NodeState => {
    let cur_node = root
    for (const [idx, seg] of segments.entries()) {
      if (seg === '') continue
      const uri = segments.slice(0, idx + 1).join('/')
      const next_nodes = cur_node.childs.filter(node => node.uri === uri)
      if (next_nodes.length > 0) {
        cur_node = next_nodes[0]
      } else {
        const new_node = {
          uri: uri,
          expand: false,
          childs: [],
        }
        cur_node.childs.push(new_node)
        cur_node = new_node
      }
    }
    return cur_node
  }

  uris.forEach(uri => traverse(uri.split('/')))
  return root
}

const assignNodeState = (toState: NodeState, fromState: NodeState) => {
  toState.expand = fromState.expand
  fromState.childs.forEach(fs => {
    const filtered = toState.childs.filter(ts => ts.uri === fs.uri)
    if (filtered.length === 0) return
    assignNodeState(filtered[0], fs)
  })
}
