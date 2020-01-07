import * as pug from 'pug'
import * as path from 'path'
import { item } from './item'

const item_render = pug.compileFile('build/ui/template/item.pug')
const base_render = pug.compileFile('build/ui/template/base.pug')

/**
 * @abstract Render the main page
 */
export function render(items: item[]) {
  return base_render({
    title: "Sine's Wiki",
    items: items.map(it => item_render({
      title: it.headers.title || 'No title',
      content: it.render()
    })).join('\n')
  })
}
