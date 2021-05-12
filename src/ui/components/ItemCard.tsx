import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { ItemDisplay } from './ItemDisplay'
import { ItemEditor } from './ItemEditor'
import anime from 'animejs/lib/anime.es'
import { getPositionToDocument } from '../Common'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'

const manager = ItemManager.getInstance()

export const ItemCard = (props: {
  uri: string
  item: ClientItem
  onClose: () => void
  onChange: (target: string) => void
}) => {
  // display / edit / save
  const [mode, setMode] = useState('display')
  const lastPositoinRef = useRef({ left: 0, top: 0 })
  const ref = useRef()

  useEffect(() => {
    eventBus.on('item-link-clicked', scrollToSelf)
    return () => eventBus.off('item-link-clicked', scrollToSelf)
  }, [])

  const scrollToSelf = async (data: { targetURI: string }) => {
    if (data.targetURI === props.uri) {
      const pos = getPositionToDocument(ref.current)
      scrollTo(pos.left, pos.top)
    }
  }

  useLayoutEffect(() => {
    ;(async () => {
      await smoothLayoutChange(ref.current, lastPositoinRef.current)
      lastPositoinRef.current = getPositionToDocument(ref.current)
    })()
  })

  const render = () => {
    switch (mode) {
      case 'display':
        return (
          <ItemDisplay
            uri={props.uri}
            item={props.item}
            onBeginEdit={async () => {
              await rotateOut(ref.current)
              setMode('edit')
              await rotateIn(ref.current)
            }}
            onDelete={() => {}}
            onClose={async () => {
              await slideOut(ref.current)
              props.onClose()
            }}
          />
        )
      case 'edit':
        return (
          <ItemEditor
            uri={props.uri}
            item={props.item}
            onSave={async (newUri: string, newItem: ClientItem) => {
              await rotateOut(ref.current)
              await manager.saveItem(newUri, newItem)
              if (props.uri !== newUri) {
                await manager.deleteItem(props.uri)
                props.onChange(newUri)
              } else {
                setMode('display')
                await rotateIn(ref.current)
              }
            }}
            onCancel={async () => {
              await rotateOut(ref.current)
              setMode('display')
              await rotateIn(ref.current)
            }}
          />
        )
      case 'save':
        return <div>saving...</div>
      default:
        return <div>???</div>
    }
  }

  return (
    <div className="item" ref={ref}>
      {render()}
    </div>
  )
}

/**
 * Animation: rotate 90 deg to hide
 * Note: .finished promise returned by anime.js is fucking erroneous,
 *       so I'm using a custom promisified style
 */
const rotateOut = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      rotateY: 90,
      duration: 100,
      easing: 'linear',
      complete: () => res(null),
    })
  })
}

/**
 * Animation: rotate 90 deg to display
 */
const rotateIn = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      rotateY: 0,
      duration: 100,
      easing: 'linear',
      complete: () => res(null),
    })
  })
}

/**
 * Animation: slide 400px while fading out
 */
const slideOut = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      translateX: -400,
      opacity: 0,
      duration: 100,
      easing: 'easeOutQuad',
      complete: () => res(null),
    })
  })
}

/**
 * Animation: Perform FLIP operation given delta x y
 */
const FLIPOperation = async (el: HTMLElement, dx: number, dy: number) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      translateX: dx,
      translateY: dy,
      duration: 100,
      easing: () => (t: number) => 1 - t,
      complete: () => res(null),
    })
  })
}

/**
 * Animation: slide to new position (vertically)
 */
const smoothLayoutChange = async (el: HTMLElement, lastPosition: { left: number; top: number }) => {
  el.style.transform = ''
  const newPosition = getPositionToDocument(el)
  if (lastPosition.left === 0) {
    await FLIPOperation(el, newPosition.left, 0)
    return
  }
  const dy = lastPosition.top - newPosition.top
  await FLIPOperation(el, 0, dy)
}
