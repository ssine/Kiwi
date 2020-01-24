/**
 * This part runs in browser
 * @packageDocumentation
 */
import '../kiwi/ui/css/global.css'
import 'highlight.js/styles/solarized-light.css'
import manager from './ItemManager'

async function run() {
  await manager.init()
}

window.onload = run
