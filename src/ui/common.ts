/**
 * Post an Object ot server and get a responed json object
 */
async function post_json(url: string, data: Object): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

export {
  post_json
}
