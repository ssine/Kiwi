/**
 * This part runs in browser
 * @packageDocumentation
 */

import { manager } from './manager'


async function run() {
  await manager.init()
}

window.onload = run
