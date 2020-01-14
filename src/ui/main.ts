/**
 * This part runs in browser
 * @packageDocumentation
 */
import '../kiwi/ui/css/global.css'
import { manager } from './manager'

async function run() {
  await manager.init()
}

window.onload = run
