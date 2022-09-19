import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { ItemDisplay } from './ItemDisplay'
import { ItemEditor } from './ItemEditor'
import { getItemCardDiv, getPositionToDocument, isMobile, scrollToElement } from '../../Common'
import { useAppSelector } from '../../store'
import { getItemFromState } from '../global/item'
import { scaleIn, smoothLayoutChange } from './operations'

export const ItemCard = (props: { uri: string }) => {
  // display / edit / save
  const { uri } = props
  const item = useAppSelector(s => getItemFromState(s, uri))
  const itemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const mode = useAppSelector(s => s.opened.items[uri]?.mode)
  const fullScreen = useAppSelector(s => s.opened.items[uri]?.fullScreen)
  const lastPositoinRef = useRef({ left: 0, top: 0 })
  console.log('item card called', uri, item)

  useLayoutEffect(() => {
    ;(async () => {
      const containerDiv = getItemCardDiv(uri)
      if (containerDiv) {
        const newPosition = getPositionToDocument(containerDiv)
        if (lastPositoinRef.current.left === 0 && lastPositoinRef.current.top === 0) {
          // initial showup is handled later
          lastPositoinRef.current = newPosition
          return
        }
        if (
          Math.abs(lastPositoinRef.current.left - newPosition.left) +
            Math.abs(lastPositoinRef.current.top - newPosition.top) <
          20
        ) {
          // small change, no animation, save computing power
          lastPositoinRef.current = newPosition
          return
        }

        await smoothLayoutChange(containerDiv, lastPositoinRef.current)
        lastPositoinRef.current = getPositionToDocument(containerDiv)
      }
    })()
  })

  useLayoutEffect(() => {
    const containerDiv = getItemCardDiv(uri)
    scrollToElement(containerDiv)
    scaleIn(containerDiv)
  }, [])

  if (!item) {
    return <div id={`kiwi-itemcard-${uri}`}></div>
  }

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
      style={{ width: fullScreen ? '100%' : isMobile ? '100vw' : itemWidth }}
    >
      {render()}
    </div>
  )
}
