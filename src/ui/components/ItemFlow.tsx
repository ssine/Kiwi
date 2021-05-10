import React, { useEffect, useReducer, useState } from 'react'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'
import { ItemDisplay } from './ItemDisplay'
import { Breadcrumb } from './basic/Breadcrumb/Breadcrumb'
import { ItemCard } from './ItemCard'
import { defaultItemsURI } from '../../boot/config'

const manager = ItemManager.getInstance()

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

export const ItemFlow = () => {
  const [uris, dispatch] = useReducer(reduceUris, [])
  console.log('render: ', uris)

  useEffect(() => {
    eventBus.on('item-link-clicked', onDisplayItem)
    ;(async () => {
      await manager.ensureItemLoaded(defaultItemsURI)
      manager
        .getItem(defaultItemsURI)
        .content.split('\n')
        .forEach(
          uri =>
            uri &&
            eventBus.emit('item-link-clicked', {
              targetURI: uri,
            })
        )
    })()
    return () => eventBus.off('item-link-clicked', onDisplayItem)
  }, [])

  const onDisplayItem = async (data: { targetURI: string }) => {
    await manager.ensureItemLoaded(data.targetURI)
    dispatch({ type: 'display', uri: data.targetURI })
  }

  return (
    <div>
      {uris.map((uri: string) => (
        <ItemCard
          key={uri}
          uri={uri}
          item={ItemManager.getInstance().getItem(uri)}
          onClose={() => {
            dispatch({ type: 'remove', uri: uri })
          }}
        />
      ))}
    </div>
  )
}
