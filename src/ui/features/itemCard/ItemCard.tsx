import React, { useLayoutEffect, useRef } from 'react'
import { ItemDisplay } from './ItemDisplay'
import { ItemEditor } from './ItemEditor'
import { getItemCardDiv, getPositionToDocument } from '../../Common'
import { useAppSelector } from '../../store'
import { getItemFromState } from '../global/item'
import { smoothLayoutChange } from './operations'

export const ItemCard = (props: { uri: string }) => {
  // display / edit / save
  const { uri } = props
  console.log(`rendering ${uri}`)
  const item = useAppSelector(s => getItemFromState(s, uri))
  const itemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const mode = useAppSelector(s => s.opened.items[uri]?.mode)
  const fullScreen = useAppSelector(s => s.opened.items[uri]?.fullScreen)
  const lastPositoinRef = useRef({ left: 0, top: 0 })

  useLayoutEffect(() => {
    ;(async () => {
      const containerDiv = getItemCardDiv(uri)
      if (containerDiv) {
        await smoothLayoutChange(containerDiv, lastPositoinRef.current)
        lastPositoinRef.current = getPositionToDocument(containerDiv)
      }
    })()
  })

  if (!item) return <></>

  const render = () => {
    switch (mode) {
      case 'display':
        return <ItemDisplay uri={props.uri} />
      case 'edit':
        return <ItemEditor uri={props.uri} />
      default:
        return <div>???</div>
    }
  }

  return (
    <div
      className={`item${fullScreen ? ' kiwi-fullscreen-item' : ''}`}
      id={`kiwi-itemcard-${uri}`}
      style={{ width: fullScreen ? '100%' : itemWidth }}
    >
      {render()}
    </div>
  )
}
