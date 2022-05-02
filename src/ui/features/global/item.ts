import { createAction, CaseReducer, PayloadAction } from '@reduxjs/toolkit'
import { WritableDraft } from 'immer/dist/internal'
import { RootState } from '..'
import { arrayEqual, resolveURI, suggestedURIToTitle } from '../../../core/Common'
import { ItemNotExistsError } from '../../../core/Error'
import { isBinaryType } from '../../../core/MimeType'
import * as api from '../../api'
import { ClientItem } from '../../ClientItem'
import { getItemCardDiv, scrollToElement } from '../../Common'
import { store } from '../../store'
import { NodeState } from '../indexTree/indexTreeSlice'

type SaveItemPayload = {
  uri: string
  item?: ClientItem
  file?: File
}

/**
 * Save an item to **Local Store**
 */
export const saveItemPending = createAction<SaveItemPayload>('saveItemPending')
export const saveItemPendingReducer: CaseReducer<RootState, PayloadAction<SaveItemPayload>> = (state, action) => {
  if (!state.items[action.payload.uri]) return
  const item = state.items[action.payload.uri]
  switch (item.state) {
    case 'bare':
      item.state = 'loading'
      break
    case 'full':
      item.state = 'saving'
      break
  }
}

export const saveItemFufilled = createAction<[SaveItemPayload, ClientItem]>('saveItemFufilled')
export const saveItemFufilledReducer: CaseReducer<RootState, PayloadAction<[SaveItemPayload, ClientItem]>> = (
  state,
  action
) => {
  const [req, item] = action.payload
  const oldItem = state.items[req.uri]
  state.items[req.uri] = item
  state.items[req.uri].state = 'full'

  const oldTags = oldItem ? oldItem.header.tags || [] : []
  const newTags = item.header.tags || []
  if (!arrayEqual(oldTags, newTags)) {
    state.tagMap = generateTagMap(state.items)
  }

  if (!oldItem || oldItem.title !== item.title) {
    state.indexTree = assignNodeState(
      generateNodeState(Object.keys(Object.assign({}, state.systemItems, state.items))),
      state.indexTree
    )
  }
}

export const saveItemFailed = createAction<SaveItemPayload>('saveItemFailed')
export const saveItemFailedReducer: CaseReducer<RootState, PayloadAction<SaveItemPayload>> = (state, action) => {
  const item = state.items[action.payload.uri]
  switch (item.state) {
    case 'loading':
      item.state = 'bare'
      break
    case 'saving':
      item.state = 'full'
      break
  }
}

type DisplayItemPayload = {
  uri: string
  mode?: 'display' | 'edit'
}
export const displayItemActionCreater = createAction<DisplayItemPayload>('displayItem')
export const displayItemReducer: CaseReducer<RootState, PayloadAction<DisplayItemPayload>> = (state, action) => {
  const uri = action.payload.uri
  const item = getItemFromState(state, uri)
  if (!item) return
  if (state.opened.uris.includes(uri)) return
  state.opened.uris.push(uri)
  state.opened.items[uri] = {
    mode: action.payload.mode || 'display',
    fullScreen: false,
  }
}

export const closeItem = createAction<string>('closeItem')
export const closeItemReducer: CaseReducer<RootState, PayloadAction<string>> = (state, action) => {
  const uri = action.payload
  if (!state.opened.uris.includes(uri)) return
  state.opened.uris = state.opened.uris.filter(u => u !== uri)
  delete state.opened.items[uri]
}

type DeleteItemPayload = {
  uri: string
  // Optional replace currently displayed item with the new one
  newUri?: string
}
export const deleteItemActionCreater = createAction<DeleteItemPayload>('deleteItem')
export const deleteItemReducer: CaseReducer<RootState, PayloadAction<DeleteItemPayload>> = (state, action) => {
  const { uri, newUri } = action.payload
  const item = state.items[uri]
  if (!item) return
  if (state.opened.uris.includes(uri)) {
    if (newUri && newUri !== uri) {
      state.opened.uris = state.opened.uris.map(u => (u === uri ? newUri : u))
      state.opened.items[newUri] = state.opened.items[uri]
    } else {
      state.opened.uris = state.opened.uris.filter(u => u !== uri)
    }
    delete state.opened.items[uri]
  }
  delete state.items[uri]
  if (item.header.tags && item.header.tags.length > 0) {
    state.tagMap = generateTagMap(state.items)
  }
  state.indexTree = assignNodeState(
    generateNodeState(Object.keys(Object.assign({}, state.systemItems, state.items))),
    state.indexTree
  )
}

type InitItemPayload = {
  items: Record<string, ClientItem>
  systemItems: Record<string, ClientItem>
}
export const initItemActionCreater = createAction<InitItemPayload>('initItem')
export const initItemReducer: CaseReducer<RootState, PayloadAction<InitItemPayload>> = (state, action) => {
  state.items = action.payload.items
  state.systemItems = action.payload.systemItems
  state.tagMap = generateTagMap(state.items)
  state.indexTree = generateNodeState(Object.keys(Object.assign({}, state.systemItems, state.items)))
}

/**
 *
 */
export const saveItem = async (arg: SaveItemPayload) => {
  store.dispatch(saveItemPending({ uri: arg.uri, item: arg.item }))
  const { uri, item, file } = arg
  let rendered: ClientItem
  if (isBinaryType(item.type)) {
    rendered = await api.putBinaryItem(uri, item, file)
  } else {
    rendered = await api.putItem(uri, item)
  }
  store.dispatch(saveItemFufilled([arg, rendered]))
}

/**
 * Create an item given the uri, a final uri will be returned as there may be conflicts.
 */
export const createItem = async (uri?: string) => {
  const state = store.getState()
  if (!uri) {
    uri = 'new-item'
  }
  if (state.items[uri]) {
    let cnt = 1
    while (state.items[`${uri}${cnt}`]) {
      cnt += 1
    }
    uri = `${uri}${cnt}`
  }
  const item: ClientItem = {
    title: suggestedURIToTitle(uri),
    type: 'text/markdown',
    state: 'bare',
    header: {
      createTime: Date.now(),
    },
    content: '',
    renderSync: false,
    renderedHTML: 'Content not rendered!',
    new: true,
  }
  await saveItem({ uri: uri, item: item })
  return uri
}

export const loadItem = async (uri: string) => {
  const state = store.getState()
  // item not exists
  if (!(uri in state.items)) return
  // other action performing, return after the action finish
  if (['loading', 'saving'].includes(state.items[uri].state))
    return new Promise(res => {
      const unsubscribe = store.subscribe(() => {
        const newState = store.getState()
        if (newState.items[uri].state === 'full') {
          unsubscribe()
          res(null)
        }
      })
    })
  // now, only bare item will be loaded
  if (state.items[uri].state !== 'bare') return

  store.dispatch(saveItemPending({ uri }))
  try {
    const item = await api.getItem(uri)
    store.dispatch(saveItemFufilled([{ uri }, item]))
  } catch (e) {
    store.dispatch(saveItemFailed({ uri }))
  }
}

export const duplicateItem = async (oldUri: string) => {
  const state = store.getState()
  const oldItem = getItemFromState(state, oldUri)
  if (!oldItem) throw new ItemNotExistsError(`item ${oldUri} not exists!`)
  let cnt = 1
  while (getItemFromState(state, `${oldUri}${cnt}`)) {
    cnt += 1
  }
  const newUri = `${oldUri}${cnt}`
  const newItem: ClientItem = {
    ...oldItem,
    title: suggestedURIToTitle(newUri),
    header: {
      ...oldItem.header,
      createTime: Date.now(),
    },
  }
  await saveItem({ uri: newUri, item: newItem })
  store.dispatch(displayItemActionCreater({ uri: newUri }))
  return newUri
}

/**
 * "Open" an item.
 * Ensures that the item is loaded
 * If the item not exists and user logged in, create one and open in edit mode
 * Otherwise, open in display mode.
 * Will scroll to the element, after open.
 */
export const displayItem = async (uri: string, mode?: 'edit' | 'display') => {
  await loadItem(uri)
  let state = store.getState()
  if (!getItemFromState(state, uri)) return
  store.dispatch(displayItemActionCreater({ uri, mode: mode || 'display' }))
  state = store.getState()
  setTimeout(() => {
    scrollToElement(getItemCardDiv(uri))
  }, 10)
}

export const deleteItem = async (uri: string, newUri?: string) => {
  const state = store.getState()
  if (!state.items[uri]) return
  await api.deleteItem(uri)
  store.dispatch(deleteItemActionCreater({ uri, newUri }))
}

export const moveItem = async (fromUri: string, toUri: string): Promise<void> => {
  if (fromUri === toUri) return
  await loadItem(fromUri)
  const state = store.getState()
  const item = getItemFromState(state, fromUri)
  if (isBinaryType(item.type)) {
    await saveItem({ uri: toUri, item, file: new File([await (await fetch(`/${fromUri}`)).blob()], '') })
  } else {
    await saveItem({ uri: toUri, item })
  }
  await deleteItem(fromUri)
}

export const moveTree = async (fromUri: string, toUri: string): Promise<void> => {
  const state = store.getState()
  const numFromSegments = fromUri.split('/').length
  for (const uri of Object.keys(state.items)) {
    if (uri === fromUri) {
      const fromName = uri.split('/').pop()
      await moveItem(uri, resolveURI(toUri, fromName))
    } else if (uri.startsWith(`${fromUri}/`)) {
      const fromName = uri
        .split('/')
        .slice(numFromSegments - 1)
        .join('/')
      await moveItem(uri, resolveURI(toUri, fromName))
    }
  }
}

export const initItems = async () => {
  const items = await api.getSkinnyItems()
  const systemItems = await api.getSystemItems()
  store.dispatch(
    initItemActionCreater({
      items: items,
      systemItems: systemItems,
    })
  )
}

export const getItemFromState = (state: RootState | WritableDraft<RootState>, uri: string) => {
  return state.items[uri] || state.systemItems[uri]
}

export const getItem = (uri: string) => {
  const state = store.getState()
  return state.items[uri] || state.systemItems[uri]
}

const generateTagMap = (items: Record<string, ClientItem>) => {
  const tagMap: Record<string, string[]> = {}
  for (const [uri, item] of Object.entries(items)) {
    if (!item.header.tags) continue
    for (const tag of item.header.tags) {
      if (!tagMap[tag]) tagMap[tag] = [uri]
      else tagMap[tag].push(uri)
    }
  }
  return tagMap
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
