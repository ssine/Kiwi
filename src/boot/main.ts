import { resolve } from 'path'
import * as command_line_parser from "command-line-args"
import { build_item_tree_from_path } from '../core/file'
import { generate_uri, generate_system_uri } from '../core/uri'
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
  let sys_dir = resolve(__dirname, '../kiwi')
  const sys_tree = await build_item_tree_from_path(sys_dir)
  console.log(sys_tree)
  console.log(item_tree)
  let uri_map = generate_uri(item_tree)
  let sys_uri_map = generate_system_uri(sys_tree)
  serve(render(sys_uri_map['$kiwi/ui/template/base.sqrl'].content, sys_uri_map['$kiwi/ui/template/item.sqrl'].content, item_tree.childs), uri_map, sys_dir)
}

run()
