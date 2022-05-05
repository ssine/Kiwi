import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { store } from '../../store'

export enum MessageType {
  error,
  warning,
  info,
  success,
}

export type Message = {
  type: MessageType
  text: string
  id?: number
  liveSecond?: number
}

export type MessageListState = Message[]

const initialState: MessageListState = []

type ShowMessageRequest = {
  type: MessageType
  text: string
  liveSecond?: number
}

let globalMessageCount = 0

export const messageListSlice = createSlice({
  name: 'messageList',
  initialState,
  reducers: {
    showMessage(state, action: PayloadAction<ShowMessageRequest & { id: number }>) {
      state.push(action.payload)
    },
    dismissMessage(state, action: PayloadAction<number>) {
      return state.filter(m => m.id !== action.payload)
    },
  },
})

export const { showMessage: showMessageInternal, dismissMessage } = messageListSlice.actions

export const showMessage = (req: ShowMessageRequest) => {
  const msgId = globalMessageCount++
  store.dispatch(showMessageInternal({ ...req, id: msgId }))
  if (req.liveSecond) {
    setTimeout(() => {
      store.dispatch(dismissMessage(msgId))
    }, req.liveSecond * 1000)
  }
}
