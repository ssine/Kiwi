import * as command_line_parser from "command-line-args"
import { build_item_tree_from_path } from '../core/file'
import { generate_uri } from '../core/uri'
import { render } from '../core/ui'
import { serve } from '../core/server'

const options = command_line_parser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'verbose', alias: 'v', type: Boolean }
])

async function run () {
  let item_tree = await build_item_tree_from_path(options.root)
  let uri_map = generate_uri(item_tree)
  serve(render(item_tree.childs), uri_map)
}

run()
