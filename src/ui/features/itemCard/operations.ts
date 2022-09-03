import { CaseReducer, createAction, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import { getItemCardDiv, getPositionToDocument, scrollToElement } from '../../Common'
import { store } from '../../store'
import anime from 'animejs'

type setItemFullScreenPayload = {
  uri: string
  fullScreen: boolean
}
export const setItemFullScreenActionCreator = createAction<setItemFullScreenPayload>('setItemFullScreen')
export const setItemFullScreenReducer: CaseReducer<RootState, PayloadAction<setItemFullScreenPayload>> = (
  state,
  action
) => {
  state.opened.items[action.payload.uri].fullScreen = action.payload.fullScreen
}

type setItemModePayload = {
  uri: string
  mode: 'edit' | 'display'
}
export const setItemMode = createAction<setItemModePayload>('setItemMode')
export const setItemModeReducer: CaseReducer<RootState, PayloadAction<setItemModePayload>> = (state, action) => {
  state.opened.items[action.payload.uri].mode = action.payload.mode
}

export const setItemFullScreen = async (arg: setItemFullScreenPayload) => {
  store.dispatch(setItemFullScreenActionCreator(arg))
  setTimeout(() => {
    if (arg.fullScreen) {
      scrollTo({ top: 0 })
    } else {
      const state = store.getState()
      scrollToElement(getItemCardDiv(arg.uri))
    }
  }, 10)
}

/**
 * Animation: rotate 90 deg to hide
 * Note: .finished promise returned by anime.js is fucking erroneous,
 *       so I'm using a custom promisified style
 */
export const rotateOut = async (el: HTMLElement) => {
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
export const rotateIn = async (el: HTMLElement) => {
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
export const scaleOut = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      scale: 0,
      opacity: 0,
      duration: 150,
      easing: 'easeInCubic',
      complete: () => res(null),
    })
  })
}

export const scaleIn = async (el: HTMLElement) => {
  return new Promise((res, rej) => {
    anime({
      targets: el,
      keyframes: [
        {
          scale: 0,
          opacity: 0,
          duration: 0,
        },
        {
          scale: 1,
          opacity: 1,
        },
      ],
      duration: 150,
      easing: 'easeOutCubic',
      complete: () => {
        el.style.transform = ''
        res(null)
      },
    })
  })
}

/**
 * Animation: Perform FLIP operation given delta x y
 */
export const FLIPOperation = async (el: HTMLElement, dx: number, dy: number) => {
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
export const smoothLayoutChange = async (el: HTMLElement, lastPosition: { left: number; top: number }) => {
  if (!el) return
  // do not overlap with existing transformations
  if (el.style.transform) return
  el.style.transform = ''
  const newPosition = getPositionToDocument(el)
  const dy = lastPosition.top - newPosition.top
  const dx = lastPosition.left - newPosition.left
  await FLIPOperation(el, dx, dy)
  el.style.transform = ''
}

export const printItem = (uri: string) => {
  const state = store.getState()
  if (!state.opened.uris.includes(uri)) return
  if (state.opened.items[uri].mode !== 'display') return
  const div = getItemCardDiv(uri)
  // see https://stackoverflow.com/questions/468881/print-div-id-printarea-div-only
  div.classList.add('kiwi-item-printing')
  const styleEl = document.createElement('style')
  styleEl.innerHTML = printHidingCSS
  document.head.append(styleEl)
  setTimeout(() => {
    window.print()
    div.classList.remove('kiwi-item-printing')
    styleEl.remove()
  }, 100)
}

const printHidingCSS = `
@media print {
  body * {
    visibility: hidden;
  }
  .kiwi-item-printing,
  .kiwi-item-printing * {
    visibility: visible;
  }
  .kiwi-item-printing {
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
