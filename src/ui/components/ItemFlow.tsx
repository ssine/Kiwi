import React, { useEffect, useReducer, useState } from 'react'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'
import { ItemDisplay } from './ItemDisplay'
import { Breadcrumb } from './basic/Breadcrumb/Breadcrumb'
import { ItemCard } from './ItemCard'
import { defaultItemsURI } from '../../boot/config'

const manager = ItemManager.getInstance()

export const ItemFlow = (props: { uris: string[]; dispatch: React.Dispatch<any> }) => {
  const { uris, dispatch } = props

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
    <div className="item-flow">
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
