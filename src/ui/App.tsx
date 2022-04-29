import React, { useEffect, useReducer, useState } from 'react'
import { FlowDisplayMode } from './Common'
import { ItemFlow } from './components/ItemFlow'
import { MessageList } from './components/MessageList'
import { Sidebar } from './components/Sidebar'
import { eventBus } from './eventBus'

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

type SetFunction<T> = (val: T) => void

const wrapLocalStorageSet = <T,>(name: string, func: SetFunction<T>): SetFunction<T> => {
  return (value: T) => {
    localStorage.setItem(name, String(value))
    func(value)
  }
}

export const App = () => {
  const [uris, dispatch] = useReducer(reduceUris, [])
  const [showSidebar, setShowSidebar] = useState(
    localStorage.getItem('showSidebar') ? localStorage.getItem('showSidebar') === 'true' : true
  )
  const [displayMode, setDisplayMode] = useState<FlowDisplayMode>(
    (localStorage.getItem('displayMode') as FlowDisplayMode) || 'center'
  )
  const [sidebarWidth, setSidebarWidth] = useState(parseInt(localStorage.getItem('sidebarWidth')) || 400)
  const [itemWidth, setItemWidth] = useState(parseInt(localStorage.getItem('itemWidth')) || 750)

  useEffect(() => {
    eventBus.on('item-deleted', data => {
      dispatch({ type: 'remove', uri: data.uri })
    })
  }, [])

  return (
    <div>
      <MessageList />
      <Sidebar
        displaiedUris={uris}
        displayMode={displayMode}
        setDisplayMode={wrapLocalStorageSet('displayMode', setDisplayMode)}
        itemWidth={itemWidth}
        setItemWidth={wrapLocalStorageSet('itemWidth', setItemWidth)}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={wrapLocalStorageSet('sidebarWidth', setSidebarWidth)}
        showSidebar={showSidebar}
        setShowSidebar={wrapLocalStorageSet('showSidebar', setShowSidebar)}
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
