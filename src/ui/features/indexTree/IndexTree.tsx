import './IndexTree.css'
import React from 'react'
import { isBinaryType, isContentType, isTextType, MIME } from '../../../core/MimeType'
import { MessageType, showMessage } from '../messageList/messageListSlice'
import { resolveURI } from '../../../core/Common'
import { store, useAppDispatch, useAppSelector } from '../../store'
import { addNodeDragCount, IndexNode, NodeState, setNodeDragCount, setRoot, switchNodeExpand } from './indexTreeSlice'
import { createItem, displayItem, moveTree, saveItem } from '../global/item'

const INDENT_WIDTH = 15

// TODO: update tree on items change
export const IndexTree = () => {
  const dispatch = useAppDispatch()
  const root = useAppSelector(s => s.indexTree.root)
  const stateMap = useAppSelector(s => s.indexTree.stateMap)
  const systemItems = useAppSelector(s => s.systemItems)
  const items = useAppSelector(s => s.items)
  const getItem = (uri: string) => items[uri] || systemItems[uri]

  const _renderTree = (node: IndexNode, level: number): JSX.Element[] => {
    let nodeList = []
    const hasChild = Object.keys(node.childs).length > 0
    const nodeState = getNodeState(stateMap, node.uri)

    const curNode = (
      <div
        key={node.uri}
        className="kiwi-indextree-item"
        style={{
          paddingLeft: INDENT_WIDTH * level,
          ...(nodeState.dragOverCount > 0 && { backgroundColor: 'var(--blockColorLighter)' }),
        }}
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
        }}
        onDragEnter={ev => {
          dispatch(addNodeDragCount({ uri: node.uri, amount: 1 }))
          setTimeout(() => {
            const { root: newRoot, stateMap: newStateMap } = store.getState().indexTree
            const curNode = findNodeinTree(newRoot, node.uri)
            const curState = getNodeState(newStateMap, node.uri)
            if (curNode && !curState.expand && curState.dragOverCount > 0) {
              dispatch(switchNodeExpand(node.uri))
            }
          }, 500)
        }}
        onDragLeave={ev => {
          dispatch(addNodeDragCount({ uri: node.uri, amount: -1 }))
        }}
        onDrop={async ev => {
          ev.preventDefault()
          ev.persist()
          const dropInside = nodeState.dragOverCount > 1
          dispatch(setNodeDragCount({ uri: node.uri, count: 0 }))
          await processDroppedContent(ev, node.uri, dropInside)
        }}
        onClick={async _ => {
          if (!getItem(node.uri)) {
            await createItem(node.uri)
            displayItem(node.uri, 'edit')
          } else {
            displayItem(node.uri)
          }
        }}
      >
        <div
          className="kiwi-indextree-frontblock"
          onDragEnter={ev => {
            dispatch(addNodeDragCount({ uri: node.uri, amount: 1 }))
          }}
          onDragLeave={ev => {
            dispatch(addNodeDragCount({ uri: node.uri, amount: -1 }))
          }}
        >
          {nodeState.dragOverCount > 0 ? (
            <div
              className={`kiwi-indextree-hovereffect ms-Icon ms-Icon--${
                nodeState.dragOverCount > 1 ? 'RadioBtnOn' : 'RadioBtnOff'
              }`}
            ></div>
          ) : hasChild ? (
            <div
              className={`kiwi-indextree-hovereffect ms-Icon ms-Icon--${
                nodeState.expand ? 'ChevronDown' : 'ChevronRight'
              }`}
              onClick={ev => {
                dispatch(switchNodeExpand(node.uri))
                ev.stopPropagation()
              }}
            ></div>
          ) : (
            <></>
          )}
        </div>
        {getItem(node.uri) ? getItem(node.uri).title : node.uri.split('/').pop()}
      </div>
    )

    nodeList.push(curNode)
    if (Object.keys(node.childs).length > 0 && nodeState.expand) {
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

const processDroppedContent = async (ev: React.DragEvent<HTMLDivElement>, zoneUri: string, inside: boolean) => {
  const from = ev.dataTransfer.getData('text/plain')
  // TODO: no an accurate description
  if (from !== '') {
    // item drag and drop
    if (from !== zoneUri) {
      await moveTree(from, `${zoneUri}${inside ? '/' : ''}`)
    }
  } else {
    // check for possible files
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      const d = ev.dataTransfer.items[i]
      if (d.kind === 'file') {
        const file = d.getAsFile()
        if (isBinaryType(file.type as MIME)) {
          const targetUri = resolveURI(`${zoneUri}${inside ? '/' : ''}`, file.name)
          await saveItem({
            uri: targetUri,
            item: {
              title: file.name,
              state: 'bare',
              type: file.type as MIME,
              header: { createTime: Date.now() },
              renderSync: false,
              renderedHTML: '',
            },
            file,
          })
        } else if (isContentType(file.type as MIME)) {
          const basename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          const targetUri = resolveURI(`${zoneUri}${inside ? '/' : ''}`, basename)
          await saveItem({
            uri: targetUri,
            item: {
              title: basename,
              state: 'bare',
              type: file.type as MIME,
              content: await file.text(),
              header: { createTime: Date.now() },
              renderSync: false,
              renderedHTML: '',
            },
          })
        } else if (isTextType(file.type as MIME)) {
          const basename = file.name
          const targetUri = resolveURI(`${zoneUri}${inside ? '/' : ''}`, basename)
          await saveItem({
            uri: targetUri,
            item: {
              title: basename,
              state: 'bare',
              type: file.type as MIME,
              content: await file.text(),
              header: { createTime: Date.now() },
              renderSync: false,
              renderedHTML: '',
            },
          })
        } else {
          showMessage({ type: MessageType.warning, text: `${file.name} ignored as type ${file.type} is not supported` })
          continue
        }
      }
    }
  }
}

const findNodeinTree = (root: IndexNode, uri: string): IndexNode | null => {
  let cur = root
  const segments = uri.split('/')
  for (const [idx, segment] of segments.entries()) {
    const prefix = segments.slice(0, idx + 1).join('/')
    const next = cur.childs.filter(n => n.uri === prefix)
    if (next.length > 0) {
      cur = next[0]
    } else {
      return null
    }
  }
  return cur
}

const getNodeState = (state: Record<string, NodeState>, uri: string) => {
  return state[uri] || { dragOverCount: 0, expand: false }
}
