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

function setCookie(key: string, value: string){
  document.cookie = `${key}=${value};`
}

function getCookie(key: string){
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
  isLinkInternal,
  getPositionToDocument,
  setCookie,
  getCookie
}
