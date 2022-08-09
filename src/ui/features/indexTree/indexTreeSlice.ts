import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type IndexNode = {
  uri: string
  childs: IndexNode[]
}

export type NodeState = {
  expand: boolean
  dragOverCount: number
  isHover: boolean
}

export type IndexTreeState = {
  root: IndexNode
  stateMap: Record<string, NodeState>
}

const initialState: IndexTreeState = {
  root: {
    uri: '',
    childs: [],
  },
  stateMap: {
    '/': { expand: true, dragOverCount: 0, isHover: false },
  },
}

export const indexTreeSlice = createSlice({
  name: 'indexTree',
  initialState,
  reducers: {
    setRoot(state, action: PayloadAction<IndexNode>) {
      state.root = action.payload
    },
    setNodeState(state, action: PayloadAction<{ uri: string; state: NodeState }>) {
      state.stateMap[action.payload.uri] = action.payload.state
    },
    addNodeDragCount(state, action: PayloadAction<{ uri: string; amount: number }>) {
      const { uri, amount } = action.payload
      if (!state.stateMap[uri]) {
        state.stateMap[uri] = { dragOverCount: 0, expand: false, isHover: false }
      }
      state.stateMap[uri].dragOverCount += amount
    },
    setNodeDragCount(state, action: PayloadAction<{ uri: string; count: number }>) {
      const { uri, count } = action.payload
      if (!state.stateMap[uri]) {
        state.stateMap[uri] = { dragOverCount: 0, expand: false, isHover: false }
      }
      state.stateMap[uri].dragOverCount = count
    },
    switchNodeExpand(state, action: PayloadAction<string>) {
      const uri = action.payload
      if (!state.stateMap[uri]) {
        state.stateMap[uri] = { dragOverCount: 0, expand: false, isHover: false }
      }
      state.stateMap[uri].expand = !state.stateMap[uri].expand
    },
    setIsHover(state, action: PayloadAction<{ uri: string; isHover: boolean }>) {
      const { uri, isHover } = action.payload
      if (!state.stateMap[uri]) {
        state.stateMap[uri] = { dragOverCount: 0, expand: false, isHover: false }
      }
      state.stateMap[uri].isHover = isHover
    },
  },
})

export const { setRoot, addNodeDragCount, setNodeDragCount, switchNodeExpand, setIsHover } = indexTreeSlice.actions
