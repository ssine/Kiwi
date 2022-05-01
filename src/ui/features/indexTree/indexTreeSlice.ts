import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type NodeState = {
  uri: string
  expand: boolean
  childs: NodeState[]
  dragOverCount: number
}

const initialState: NodeState = {
  uri: '',
  expand: false,
  childs: [],
  dragOverCount: 0,
}

export const indexTreeSlice = createSlice({
  name: 'indexTree',
  initialState,
  reducers: {
    setRoot(state, action: PayloadAction<NodeState>) {
      return action.payload
    },
  },
})

export const { setRoot } = indexTreeSlice.actions
