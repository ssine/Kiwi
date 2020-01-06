import * as command_line_parser from "command-line-args"
import { build_file_tree } from './file-adapter'

const options = command_line_parser([
  { name: 'root', type: String, defaultOption: true, defaultValue: '.' },
  { name: 'verbose', alias: 'v', type: Boolean }
])

async function run () {
  console.log(`${await build_file_tree(options.root)}`)
}

console.log(options)

run()
