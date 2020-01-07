import * as command_line_parser from "command-line-args"
import { build_file_tree } from '../core/file'
import { build_item_tree } from '../core/item'
import { generate_uri } from '../core/uri'
import { render } from '../core/ui'
import { serve } from '../core/server'

const options = command_line_parser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'verbose', alias: 'v', type: Boolean }
])

async function run () {
  let file_tree = await build_file_tree(options.root)
  let item_tree = build_item_tree(file_tree)
  let uri_map = generate_uri(item_tree)
  console.log(`${file_tree  }`)
  serve(render(item_tree.childs), uri_map)
}

run()
