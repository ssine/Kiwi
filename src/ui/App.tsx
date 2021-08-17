import React, { CSSProperties, useEffect, useReducer, useState } from 'react'
import { getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'
import { FlowDisplayMode } from './Common'
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
  const [showSidebar, setShowSidebar] = useState(true)
  const [displayMode, setDisplayMode] = useState<FlowDisplayMode>('center')
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [itemWidth, setItemWidth] = useState(750)

  return (
    <div>
      <MessageList />
      <Sidebar
        displaiedUris={uris}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        itemWidth={itemWidth}
        setItemWidth={setItemWidth}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        setShowSidebar={setShowSidebar}
      />
      <ItemFlow
        uris={uris}
        displayMode={displayMode}
        itemWidth={itemWidth}
        showSidebar={showSidebar}
        sidebarWidth={sidebarWidth}
        dispatch={dispatch}
      />
    </div>
  )
}
