import React, { useEffect, useReducer, useRef, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { ItemDisplay } from './ItemDisplay'
import { ItemEditor } from './ItemEditor'
import anime from 'animejs/lib/anime.es'

export const ItemCard = (props: { uri: string; item: ClientItem; onClose: () => void }) => {
  // display / edit / save
  const [mode, setMode] = useState('display')
  const ref = useRef()

  const render = () => {
    switch (mode) {
      case 'display':
        return (
          <ItemDisplay
            uri={props.uri}
            item={props.item}
            onBeginEdit={() => setMode('edit')}
            onDelete={() => {}}
            onClose={async () => {
              await slideOut(ref.current)
              props.onClose()
            }}
          />
        )
      case 'edit':
        return <ItemEditor />
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

const slideOut = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      translateX: -200,
      opacity: 0,
      duration: 100,
      easing: 'easeOutQuad',
      complete: () => res(null),
    })
  })
}
