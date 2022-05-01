import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type SidebarState = {
  show: boolean
  width: number
}

const initialState = {
  show: localStorage.getItem('showSidebar') ? localStorage.getItem('showSidebar') === 'true' : true,
  width: parseInt(localStorage.getItem('sidebarWidth')) || 400,
}

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    showSidebar(state) {
      state.show = true
      localStorage.setItem('showSidebar', String(true))
    },
    hideSidebar(state) {
      state.show = false
      localStorage.setItem('showSidebar', String(false))
    },
    setSidebarWidth(state, action: PayloadAction<number>) {
      state.width = action.payload
      localStorage.setItem('sidebarWidth', String(action.payload))
    },
  },
})

export const { showSidebar, hideSidebar, setSidebarWidth } = sidebarSlice.actions
