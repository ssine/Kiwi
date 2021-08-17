import React, { MutableRefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  itemWidth: number
  containerRef?: MutableRefObject<HTMLDivElement>
  onClose: () => void
  onChange: (target: string) => void
}) => {
  // display / edit / save
  const item = ItemManager.getInstance().getItem(props.uri)
  const [mode, setMode] = useState(item.new ? 'edit' : 'display')
  const [fullscreen, _setFullscreen] = useState(false)
  const lastPositoinRef = useRef({ left: 0, top: 0 })
  const ref = props.containerRef || useRef<HTMLDivElement>()

  useEffect(() => {
    eventBus.on('item-link-clicked', scrollToSelf)
    scrollToSelf({ targetURI: props.uri })
    console.log('remounted', props.uri)
    return () => eventBus.off('item-link-clicked', scrollToSelf)
  }, [])

  const scrollToSelf = async (data: { targetURI: string }) => {
    if (data.targetURI === props.uri) {
      const pos = getPositionToDocument(ref.current)
      scrollTo(pos.left, pos.top)
    }
  }

  const setFullscreen = (fsmode: boolean) => {
    _setFullscreen(fsmode)
    setTimeout(() => {
      if (fsmode) {
        scrollTo({ top: 0 })
      } else {
        scrollToSelf({ targetURI: props.uri })
      }
    }, 10)
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
            item={item}
            onBeginEdit={async () => {
              await rotateOut(ref.current)
              setMode('edit')
              await rotateIn(ref.current)
            }}
            onDelete={async () => {
              await manager.deleteItem(props.uri)
              await slideOut(ref.current)
              props.onClose()
            }}
            onClose={async () => {
              await slideOut(ref.current)
              props.onClose()
            }}
            onPrint={() => {
              // see https://stackoverflow.com/questions/468881/print-div-id-printarea-div-only
              const oldId = ref.current.id
              ref.current.id = 'kiwi-item-printing'
              const styleEl = document.createElement('style')
              styleEl.innerHTML = printHidingCSS
              document.head.append(styleEl)
              setTimeout(() => {
                window.print()
                ref.current.id = oldId
                styleEl.remove()
              }, 100)
            }}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
          />
        )
      case 'edit':
        return (
          <ItemEditor
            uri={props.uri}
            item={item}
            onSave={async (newUri: string, newItem: ClientItem) => {
              await rotateOut(ref.current)
              try {
                await manager.saveItem(newUri, newItem)
              } catch (err) {
                await rotateIn(ref.current)
                return
              }
              if (props.uri !== newUri) {
                await manager.deleteItem(props.uri)
                props.onChange(newUri)
              } else {
                setMode('display')
                await rotateIn(ref.current)
              }
            }}
            onCancel={async () => {
              if (item.new) {
                await manager.deleteItem(props.uri)
                await slideOut(ref.current)
                props.onClose()
              } else {
                await rotateOut(ref.current)
                setMode('display')
                await rotateIn(ref.current)
              }
            }}
            fullscreen={fullscreen}
            setFullscreen={setFullscreen}
          />
        )
      case 'save':
        return <div>saving...</div>
      default:
        return <div>???</div>
    }
  }

  return (
    <div className="item" id={fullscreen ? 'kiwi-fullscreen-item' : ''} ref={ref} style={{ width: props.itemWidth }}>
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
  const dx = lastPosition.left - newPosition.left
  await FLIPOperation(el, dx, dy)
}

const printHidingCSS = `
@media print {
  body * {
    visibility: hidden;
  }
  #kiwi-item-printing,
  #kiwi-item-printing * {
    visibility: visible;
  }
  #kiwi-item-printing {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none;
  }
  .item-controls {
    display: none !important;
  }
}
`
