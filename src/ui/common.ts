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
function getPositionToDocument(el: Element): {top: number, left: number} {
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

export {
  postJSON,
  postFile,
  isLinkInternal,
  getPositionToDocument,
  setCookie,
  getCookie
}
