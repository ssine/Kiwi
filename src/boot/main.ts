import * as commandLineParser from "command-line-args"
import manager from '../core/ItemManager'
import serve from '../core/server'
import { initLogger } from '../core/Log'

const options = commandLineParser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'log', alias: 'l', type: String, defaultValue: 'debug' }
])

initLogger(options.log)

async function run () {
  await manager.loadItems(options.root)
  serve()
}

run()
