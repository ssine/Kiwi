import React, { useEffect, useReducer, useState } from 'react'
import { getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'
import { ItemFlow } from './components/ItemFlow'
import { MessageList } from './components/MessageList'
import { Sidebar } from './components/Sidebar'

const reduceUris = (uris: string[], action: any) => {
  switch (action.type) {
    case 'display':
      if (uris.includes(action.uri)) {
        // scroll to it...
        return uris
      }
      return [...uris, action.uri]
    case 'remove':
      if (uris.includes(action.uri)) {
        uris.splice(uris.indexOf(action.uri), 1)
        return [...uris]
      }
      return uris
    case 'change':
      if (uris.includes(action.fromUri)) {
        uris.splice(uris.indexOf(action.fromUri), 1, action.toUri)
        return [...uris]
      }
      return uris
    default:
      throw new Error()
  }
}

export const App = () => {
  const [uris, dispatch] = useReducer(reduceUris, [])

  return (
    <div>
      <MessageList />
      <Sidebar displaiedUris={uris} /> <ItemFlow uris={uris} dispatch={dispatch} />
    </div>
  )
}
