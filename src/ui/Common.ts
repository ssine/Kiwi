/**
 * Check if a link is external of internal
 */
function isLinkInternal(el: HTMLAnchorElement): boolean {
  return el.host === window.location.host
}

/**
 * Get the postition of an element relative to the root document
 */
function getPositionToDocument(el: Element): { top: number; left: number } {
  const rect = el.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
  }
}

function setCookie(key: string, value: string, secondsToLive?: number) {
  let cookieStr = `${key}=${value};`
  if (secondsToLive) {
    cookieStr += `max-age=${secondsToLive};`
  }
  document.cookie = cookieStr
}

function getCookie(key: string) {
  const name = key + '='
  for (let item of document.cookie.split(';')) {
    item = item.trim()
    if (item.indexOf(name) === 0) {
      return item.substring(name.length)
    }
  }
  return ''
}

function removeCookie(key: string) {
  setCookie(key, '', -1)
}

const CSSColorToRGBA = (function () {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')

  return function (col: string) {
    ctx.clearRect(0, 0, 1, 1)
    // In order to detect invalid values,
    // we can't rely on col being in the same format as what fillStyle is computed as,
    // but we can ask it to implicitly compute a normalized value twice and compare.
    ctx.fillStyle = '#000'
    ctx.fillStyle = col
    const computed = ctx.fillStyle
    ctx.fillStyle = '#fff'
    ctx.fillStyle = col
    if (computed !== ctx.fillStyle) {
      return { r: 0, g: 0, b: 0, a: 0 } // invalid color
    }
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3],
    }
  }
})()

function RGBtoHSV(color: { r: number; g: number; b: number }) {
  const r = color.r
  const g = color.g
  const b = color.b
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    h,
    s = max === 0 ? 0 : d / max,
    v = max / 255

  switch (max) {
    case min:
      h = 0
      break
    case r:
      h = g - b + d * (g < b ? 6 : 0)
      h /= 6 * d
      break
    case g:
      h = b - r + d * 2
      h /= 6 * d
      break
    case b:
      h = r - g + d * 4
      h /= 6 * d
      break
  }

  return {
    h: h,
    s: s,
    v: v,
  }
}

function HSVtoRGB(color: { h: number; s: number; v: number }) {
  const h = color.h
  const s = color.s
  const v = color.v
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r: number
  let b: number
  let g: number
  switch (i % 6) {
    case 0:
      ;(r = v), (g = t), (b = p)
      break
    case 1:
      ;(r = q), (g = v), (b = p)
      break
    case 2:
      ;(r = p), (g = v), (b = t)
      break
    case 3:
      ;(r = p), (g = q), (b = v)
      break
    case 4:
      ;(r = t), (g = p), (b = v)
      break
    case 5:
      ;(r = v), (g = p), (b = q)
      break
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function RGBtoCSSColor(rgb: { r: number; g: number; b: number }): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

function setPageColors(hue: number) {
  const rootStyle = (document.querySelector(':root') as HTMLElement).style
  rootStyle.setProperty('--primaryColor', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 1, v: 1 })))
  rootStyle.setProperty('--lineColor', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 0.54, v: 0.62 })))
  rootStyle.setProperty('--blockColor', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 0.26, v: 0.84 })))
  rootStyle.setProperty('--blockColorLight', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 0.24, v: 0.9 })))
  rootStyle.setProperty('--blockColorLighter', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 0.17, v: 0.93 })))
  rootStyle.setProperty('--areaColor', RGBtoCSSColor(HSVtoRGB({ h: hue, s: 0.04, v: 0.98 })))
}

const isMobile = window.screen.width >= 1024 ? false : true

// adapted from:
/*! getEmPixels  | Author: Tyson Matanich (http://matanich.com), 2013 | License: MIT */
const getEmPixels = (() => {
  const documentElement = document.documentElement
  const important = '!important;'
  const style =
    ['position:absolute', 'visibility:hidden', 'width:1em', 'font-size:1em', 'padding:0'].join(important) + important

  return (element?: HTMLElement): number => {
    let extraBody: HTMLBodyElement

    if (!element) {
      // Emulate the documentElement to get rem value (documentElement does not work in IE6-7)
      element = extraBody = document.createElement('body')
      extraBody.style.cssText = 'font-size:1em' + important
      documentElement.insertBefore(extraBody, document.body)
    }

    // Create and style a test element
    const testElement = document.createElement('i')
    testElement.style.cssText = style
    element.appendChild(testElement)

    // Get the client width of the test element
    const value = testElement.clientWidth

    if (extraBody) {
      // Remove the extra body element
      documentElement.removeChild(extraBody)
    } else {
      // Remove the test element
      element.removeChild(testElement)
    }

    // Return the em value in pixels
    return value
  }
})()

export const setToNewArray = (arr: any[], idx: number, val: any) => {
  const newArr = [...arr]
  newArr[idx] = val
  return newArr
}

export {
  isLinkInternal,
  getPositionToDocument,
  setCookie,
  getCookie,
  removeCookie,
  CSSColorToRGBA,
  RGBtoHSV,
  HSVtoRGB,
  RGBtoCSSColor,
  setPageColors,
  isMobile,
  getEmPixels,
}
