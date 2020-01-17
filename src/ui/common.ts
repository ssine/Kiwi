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

export {
  postJSON,
  isLinkInternal
}
