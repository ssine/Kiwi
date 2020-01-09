/**
 * @todo Make pug an internal supported type and pass template function to
 * client side.
 */
import * as sqrl from 'squirrelly'
import { item } from './item_base'

sqrl.autoEscaping(false)

/**
 * Render the main page
 */
export function render(template: string, item_tmpl: string, items: item[]): string {
  return sqrl.Render(template, {
    title: "Sine's Wiki",
    items: items.map(it => sqrl.Render(item_tmpl, {
      title: it.headers.title || 'No title',
      content: it.html()
    })).join('')
  })
  
}