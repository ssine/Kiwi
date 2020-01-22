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

export {
  postJSON,
  isLinkInternal,
  getPositionToDocument
}
