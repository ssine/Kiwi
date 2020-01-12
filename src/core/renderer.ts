import * as sqrl from 'squirrelly'
import { item } from './item'
import { template as tmpl_cfg } from '../boot/config'
import { manager } from './item_manager'

sqrl.autoEscaping(false)

/**
 * Render the main page with default items
 * Not used for now, but in future for server-side rendering
 */
function render(items: item[]): string {
  const map = manager.get_uri_item_map()
  const base_tmpl = map[tmpl_cfg.base].content
  const item_tmpl = map[tmpl_cfg.item].content
  return sqrl.Render(base_tmpl, {
    title: "Sine's Wiki",
    items: items.map(it => sqrl.Render(item_tmpl, {
      title: it.headers.title || 'No title',
      content: it.html()
    })).join('')
  })
}
