import { combineReducers, createReducer, Reducer } from '@reduxjs/toolkit'
import { ClientItem } from '../ClientItem'
import {
  closeItem,
  closeItemReducer,
  deleteItemActionCreater,
  deleteItemReducer,
  displayItemActionCreater,
  displayItemReducer,
  initItemActionCreater,
  initItemReducer,
  saveItemFailed,
  saveItemFailedReducer,
  saveItemFufilled,
  saveItemFufilledReducer,
  saveItemPending,
  saveItemPendingReducer,
} from './global/item'
import { setSubtitle, setSubtitleReducer, setTitle, setTitleReducer } from './global/title'
import { itemFlowSlice, ItemFlowState } from './itemFlow/itemFlowSlice'
import { sidebarSlice, SidebarState } from './sidebar/sidebarSlice'
import { indexTreeSlice, NodeState } from './indexTree/indexTreeSlice'
import { messageListSlice, MessageListState } from './messageList/messageListSlice'
import {
  setItemFullScreenActionCreator,
  setItemFullScreenReducer,
  setItemMode,
  setItemModeReducer,
} from './itemCard/operations'

export type RootState = {
  // uri -> item
  items: Record<string, ClientItem>
  systemItems: Record<string, ClientItem>

  // tag -> uris
  tagMap: Record<string, string[]>

  indexTree: NodeState

  opened: {
    uris: string[]
    items: Record<
      string,
      {
        mode: 'display' | 'edit'
        fullScreen: boolean
      }
    >
  }

  sidebar: SidebarState
  itemFlow: ItemFlowState

  messages: MessageListState
  siteTitle: string
  siteSubtitle: string
}

export const zeroState: RootState = {
  items: {},
  systemItems: {},
  tagMap: {},
  indexTree: indexTreeSlice.getInitialState(),
  opened: { uris: [], items: {} },
  sidebar: sidebarSlice.getInitialState(),
  itemFlow: itemFlowSlice.getInitialState(),
  messages: messageListSlice.getInitialState(),
  siteSubtitle: '',
  siteTitle: '',
}

const globalActionTypes = [
  setTitle,
  setSubtitle,
  saveItemPending,
  saveItemFufilled,
  saveItemFailed,
  displayItemActionCreater,
  closeItem,
  deleteItemActionCreater,
  initItemActionCreater,
  setItemFullScreenActionCreator,
  setItemMode,
].map(act => act.toString())

const globalReducer = createReducer(zeroState, builder => {
  builder.addCase(setTitle, setTitleReducer)
  builder.addCase(setSubtitle, setSubtitleReducer)
  builder.addCase(saveItemPending, saveItemPendingReducer)
  builder.addCase(saveItemFufilled, saveItemFufilledReducer)
  builder.addCase(saveItemFailed, saveItemFailedReducer)
  builder.addCase(displayItemActionCreater, displayItemReducer)
  builder.addCase(closeItem, closeItemReducer)
  builder.addCase(deleteItemActionCreater, deleteItemReducer)
  builder.addCase(initItemActionCreater, initItemReducer)
  builder.addCase(setItemFullScreenActionCreator, setItemFullScreenReducer)
  builder.addCase(setItemMode, setItemModeReducer)
})

export const rootReducer: Reducer<RootState> = (state, action) => {
  if (globalActionTypes.includes(action.type)) {
    return globalReducer(state, action)
  }
  return combineReducers<RootState>({
    sidebar: sidebarSlice.reducer,
    itemFlow: itemFlowSlice.reducer,
    indexTree: indexTreeSlice.reducer,
    messages: messageListSlice.reducer,
    items: state => (state ? state : zeroState.items),
    systemItems: state => (state ? state : zeroState.systemItems),
    tagMap: state => (state ? state : zeroState.tagMap),
    opened: state => (state ? state : zeroState.opened),
    siteSubtitle: state => (state ? state : zeroState.siteSubtitle),
    siteTitle: state => (state ? state : zeroState.siteTitle),
  })(state, action)
}
