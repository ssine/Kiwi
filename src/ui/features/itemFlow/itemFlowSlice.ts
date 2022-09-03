import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { FlowDisplayMode } from '../../Common'

export type ItemFlowState = {
  displayMode: FlowDisplayMode
  itemWidth: number
}

const initialState: ItemFlowState = {
  displayMode: (localStorage.getItem('displayMode') as FlowDisplayMode) || 'flow',
  itemWidth: parseInt(localStorage.getItem('itemWidth') || '') || 750,
}

export const itemFlowSlice = createSlice({
  name: 'itemFlow',
  initialState,
  reducers: {
    setDisplayMode(state, action: PayloadAction<FlowDisplayMode>) {
      state.displayMode = action.payload
      localStorage.setItem('displayMode', String(action.payload))
    },
    setItemWidth(state, action: PayloadAction<number>) {
      state.itemWidth = action.payload
      // TODO: use subscribe with debunce or state serializer
      localStorage.setItem('itemWidth', String(action.payload))
    },
  },
})

export const { setDisplayMode, setItemWidth } = itemFlowSlice.actions
