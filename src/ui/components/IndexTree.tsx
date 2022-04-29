import './IndexTree.css'
import React, { useEffect, useState } from 'react'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'
import { isBinaryType, isContentType, MIME } from '../../core/MimeType'
import { MessageType, showMessage } from './MessageList'
import { resolveURI } from '../../core/Common'

const manager = ItemManager.getInstance()

type NodeState = {
  uri: string
  expand: boolean
  childs: NodeState[]
  dragOverCount: number
}

const INDENT_WIDTH = 15

const getState = () => generateNodeState(Object.keys(Object.assign({}, manager.systemItems, manager.items)))

// TODO: update tree on items change
export const IndexTree = () => {
  const [root, setRoot] = useState(getState())

  useEffect(() => {
    eventBus.on('item-tree-changed', () => {
      setRoot(oldRoot => {
        return assignNodeState(getState(), oldRoot)
      })
    })
  }, [])

  const _renderTree = (node: NodeState, level: number): JSX.Element[] => {
    let nodeList = []
    const hasChild = Object.keys(node.childs).length > 0
    const curNode = (
      <div
        key={node.uri}
        className="kiwi-indextree-item"
        style={{ paddingLeft: INDENT_WIDTH * level }}
        draggable={true}
        onDragStart={ev => {
          ev.dataTransfer.setData('text/plain', node.uri)
          /**
           * we don't want to allow drop on the same object, but html api won't allow reading
           * data content on drag over (only on drop). So we add uri as a type and just inspect
           * if that type exists.
           * see https://stackoverflow.com/a/28487486
           */
          ev.dataTransfer.setData(node.uri, 'dummy')
        }}
        onDragOver={ev => {
          const isSelf = node.uri.startsWith(ev.dataTransfer.types[1])
          if (!isSelf) {
            ev.preventDefault()
          }
          if (hasChild && !isSelf && !node.expand) {
            node.expand = true
            setRoot({ ...root })
          }
        }}
        onDragEnter={ev => {
          node.dragOverCount++
          setRoot({ ...root })
        }}
        onDragLeave={ev => {
          node.dragOverCount--
          setRoot({ ...root })
        }}
        onDrop={async ev => {
          ev.preventDefault()
          ev.persist()
          const dropInside = node.dragOverCount > 1
          node.dragOverCount = 0
          setRoot({ ...root })
          await processDroppedContent(ev, node.uri, dropInside)
        }}
        onClick={_ => {
          eventBus.emit('item-link-clicked', {
            targetURI: node.uri,
          })
        }}
      >
        <div
          className="kiwi-indextree-frontblock"
          onDragEnter={ev => {
            node.dragOverCount++
            setRoot({ ...root })
          }}
          onDragLeave={ev => {
            node.dragOverCount--
            setRoot({ ...root })
          }}
        >
          {node.dragOverCount > 0 ? (
            <div
              className={`kiwi-indextree-hovereffect ms-Icon ms-Icon--${
                node.dragOverCount > 1 ? 'RadioBtnOn' : 'RadioBtnOff'
              }`}
            ></div>
          ) : hasChild ? (
            <div
              className={`kiwi-indextree-hovereffect ms-Icon ms-Icon--${node.expand ? 'ChevronDown' : 'ChevronRight'}`}
              onClick={ev => {
                node.expand = !node.expand
                setRoot({
                  ...root,
                })
                ev.stopPropagation()
              }}
            ></div>
          ) : (
            <></>
          )}
        </div>
        {manager.getItem(node.uri) ? manager.getItem(node.uri).title : node.uri.split('/').pop()}
      </div>
    )

    nodeList.push(curNode)
    if (Object.keys(node.childs).length > 0 && node.expand) {
      nodeList = nodeList.concat(
        Object.values(node.childs)
          // sort nodes, folder first, lexicographically smaller one first
          .sort((a, b) =>
            `${a.childs.length > 0 ? '0' : '1'}${a.uri}` > `${b.childs.length > 0 ? '0' : '1'}${b.uri}` ? 1 : -1
          )
          .map(child => {
            return _renderTree(child, level + 1)
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
    dragOverCount: 0,
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
          dragOverCount: 0,
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
  return toState
}

const processDroppedContent = async (ev: React.DragEvent<HTMLDivElement>, zoneUri: string, inside: boolean) => {
  const from = ev.dataTransfer.getData('text/plain')
  // TODO: no an accurate description
  if (from !== '') {
    // item drag and drop
    if (from !== zoneUri) {
      await manager.moveTree(from, `${zoneUri}${inside ? '/' : ''}`)
    }
  } else {
    // check for possible files
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      const d = ev.dataTransfer.items[i]
      if (d.kind === 'file') {
        const file = d.getAsFile()
        if (isBinaryType(file.type as MIME)) {
          const targetUri = resolveURI(`${zoneUri}${inside ? '/' : ''}`, file.name)
          await manager.saveItem(
            targetUri,
            {
              title: file.name,
              skinny: true,
              type: file.type as MIME,
              header: {},
              renderSync: false,
              renderedHTML: '',
            },
            file
          )
        } else if (isContentType(file.type as MIME)) {
          const basename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          const targetUri = resolveURI(`${zoneUri}${inside ? '/' : ''}`, basename)
          await manager.saveItem(targetUri, {
            title: basename,
            skinny: true,
            type: file.type as MIME,
            content: await file.text(),
            header: {},
            renderSync: false,
            renderedHTML: '',
          })
        } else {
          showMessage(MessageType.warning, `${file.name} ignored as type ${file.type} is not supported`)
          continue
        }
      }
    }
  }
}
