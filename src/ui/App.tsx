import React, { useEffect, useReducer, useState } from 'react'
import { getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'
import { ItemFlow } from './components/ItemFlow'
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
    default:
      throw new Error()
  }
}

export const App = () => {
  const [uris, dispatch] = useReducer(reduceUris, [])

  return (
    <div>
      <Sidebar displaiedUris={uris} /> <ItemFlow uris={uris} dispatch={dispatch} />
    </div>
  )
}
