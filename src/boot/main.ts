import * as command_line_parser from "command-line-args"
import { build_item_tree_from_path } from '../core/file'
import { generate_uri } from '../core/uri'
import { render } from '../core/ui'
import { serve } from '../core/server'
import { init as init_logger } from '../core/log'

const options = command_line_parser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'log', alias: 'l', type: String, defaultValue: 'debug' }
])

async function run () {
  init_logger(options.log)
  let item_tree = await build_item_tree_from_path(options.root)
  console.log(item_tree)
  let uri_map = generate_uri(item_tree)
  serve(render(item_tree.childs), uri_map)
}

run()
