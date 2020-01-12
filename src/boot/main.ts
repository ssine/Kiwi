import { resolve } from 'path'
import * as command_line_parser from "command-line-args"
import { manager } from '../core/item_manager'
import { serve } from '../core/server'
import { init as init_logger } from '../core/log'

const options = command_line_parser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'log', alias: 'l', type: String, defaultValue: 'debug' }
])

async function run () {
  init_logger(options.log)
  await manager.load_items(options.root)
  serve('')
}

run()
