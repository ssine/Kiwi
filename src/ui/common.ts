/**
 * Post an Object ot server and get a responed json object
 */
async function postJSON(url: string, data: Object): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (response.status === 404) throw 'POST got 404 error'
  return await response.json();
}

async function postFile(path: string, file: File): Promise<any> {
  let fm = new FormData()
  fm.append('path', path)
  fm.append('fn', file)
  await fetch('/fileupload', {
    method: 'POST',
    body: fm
  })
}

/**
 * Check if a link is external of internal
 */
function isLinkInternal(el: HTMLAnchorElement): boolean {
  return el.host === window.location.host
}

/**
 * Get the postition of an element relative to the root document
 */
function getPositionToDocument(el: Element): { top: number, left: number } {
  const rect = el.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft
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
  var name = key + '='
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

function timeFormat(fmt: string, date: Date): string {
  const opt = {
      "Y+": date.getFullYear().toString(),        
      "M+": (date.getMonth() + 1).toString(),     
      "D+": date.getDate().toString(),            
      "H+": date.getHours().toString(),           
      "m+": date.getMinutes().toString(),         
      "s+": date.getSeconds().toString(),    
      "S+": date.getMilliseconds().toString()          
  };
  for (let k in opt) {
      let ret = new RegExp("(" + k + ")").exec(fmt);
      if (ret) {
          fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
      };
  };
  return fmt;
}

const CSSColorToRGBA = (function () {
  var canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  var ctx = canvas.getContext('2d')

  return function (col: string) {
    ctx.clearRect(0, 0, 1, 1)
    // In order to detect invalid values,
    // we can't rely on col being in the same format as what fillStyle is computed as,
    // but we can ask it to implicitly compute a normalized value twice and compare.
    ctx.fillStyle = '#000'
    ctx.fillStyle = col
    var computed = ctx.fillStyle
    ctx.fillStyle = '#fff'
    ctx.fillStyle = col
    if (computed !== ctx.fillStyle) {
      return {r: 0, g: 0, b: 0, a: 0}// invalid color
    }
    ctx.fillRect(0, 0, 1, 1)
    let data = ctx.getImageData(0, 0, 1, 1).data
    return {
      r: data[0],
      g: data[1],
      b: data[2],
      a: data[3],
    }
  }
})()

function RGBtoHSV(color: {r: number, g: number, b: number}) {
  let r = color.r
  let g = color.g
  let b = color.b
  var max = Math.max(r, g, b), min = Math.min(r, g, b),
    d = max - min,
    h,
    s = (max === 0 ? 0 : d / max),
    v = max / 255;

  switch (max) {
    case min: h = 0; break;
    case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
    case g: h = (b - r) + d * 2; h /= 6 * d; break;
    case b: h = (r - g) + d * 4; h /= 6 * d; break;
  }

  return {
    h: h,
    s: s,
    v: v
  };
}

function HSVtoRGB(color: {h: number, s: number, v: number}) {
  let h = color.h
  let s = color.s
  let v = color.v
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  let r: number
  let b: number
  let g: number
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function RGBtoCSSColor(rgb: {r: number, g: number, b: number}): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

function setPageColors(hue: number) {
  let rootStyle = (document.querySelector(':root') as HTMLElement).style
  rootStyle.setProperty('--primaryColor', RGBtoCSSColor(HSVtoRGB({h: hue, s: 1, v: 1})))
  rootStyle.setProperty('--lineColor', RGBtoCSSColor(HSVtoRGB({h: hue, s: 0.54, v: 0.62})))
  rootStyle.setProperty('--blockColor', RGBtoCSSColor(HSVtoRGB({h: hue, s: 0.26, v: 0.84})))
  rootStyle.setProperty('--blockColorLight', RGBtoCSSColor(HSVtoRGB({h: hue, s: 0.24, v: 0.90})))
  rootStyle.setProperty('--blockColorLighter', RGBtoCSSColor(HSVtoRGB({h: hue, s: 0.17, v: 0.93})))
  rootStyle.setProperty('--areaColor', RGBtoCSSColor(HSVtoRGB({h: hue, s: 0.04, v: 0.98})))
}

const isMobile = window.screen.width >= 1024 ? false : true

export {
  postJSON,
  postFile,
  isLinkInternal,
  getPositionToDocument,
  setCookie,
  getCookie,
  removeCookie,
  timeFormat,
  CSSColorToRGBA,
  RGBtoHSV,
  HSVtoRGB,
  RGBtoCSSColor,
  setPageColors,
  isMobile,
}
