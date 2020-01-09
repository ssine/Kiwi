/**
 * @todo Make pug an internal supported type and pass template function to
 * client side.
 */

import * as pug from 'pug'
import { item } from './item_base'

export const item_render = pug.compileFile('build/ui/template/item.pug')
const base_render = pug.compileFile('build/ui/template/base.pug')

/**
 * Render the main page
 */
export function render(items: item[]) {
  return base_render({
    title: "Sine's Wiki",
    items: items.map(it => item_render({
      title: it.headers.title || 'No title',
      content: it.html()
    })).join('\n')
  })
}
