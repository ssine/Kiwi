import React from 'react'
import { ItemFlow } from './features/itemFlow/ItemFlow'
import { Sidebar } from './features/sidebar/Sidebar'
import { MessageList } from './features/messageList/MessageList'
import { Provider } from 'react-redux'
import { store } from './store'

export const App = () => {
  return (
    <Provider store={store}>
      <MessageList />
      <Sidebar />
      <ItemFlow />
    </Provider>
  )
}
