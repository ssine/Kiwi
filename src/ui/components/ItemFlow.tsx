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
    eventBus.on('create-item-clicked', onCreateItem)
    displayInitItems()
    return () => {
      eventBus.off('item-link-clicked', onDisplayItem)
      eventBus.off('create-item-clicked', onCreateItem)
    }
  }, [])

  const onDisplayItem = async (data: { targetURI: string }) => {
    if (!manager.hasItem(data.targetURI)) return onCreateItem(data)
    await manager.ensureItemLoaded(data.targetURI)
    dispatch({ type: 'display', uri: data.targetURI })
  }

  const onCreateItem = async (data: { targetURI?: string }) => {
    const uri = manager.createItem(data?.targetURI)
    dispatch({ type: 'display', uri: uri })
  }

  return (
    <div className="item-flow">
      {uris.map((uri: string) => (
        <ItemCard
          key={uri}
          uri={uri}
          onClose={() => {
            dispatch({ type: 'remove', uri: uri })
          }}
          onChange={(target: string) => {
            dispatch({ type: 'change', fromUri: uri, toUri: target })
          }}
        />
      ))}
    </div>
  )
}

const displayInitItems = async () => {
  if (window.location.hash != '') {
    // have uris in has
    eventBus.emit('item-link-clicked', {
      targetURI: window.location.hash.substr(1),
    })
  } else {
    // render default items
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
  }
}
