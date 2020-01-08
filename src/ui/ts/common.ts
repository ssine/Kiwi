/**
 * now using
 * ajax()
 * from jquery, consider rewriting them in the future
 * to minimize the script size
 */
import $ from 'jquery'

export function load_item(uri: string): Promise<string> {
  return new Promise(resolve => {
    $.ajax(uri).then(data => resolve(data))
  })
}
