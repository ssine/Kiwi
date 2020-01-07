import { fs_node } from './file'
import * as fs from 'fs'
import { parse } from './parser'

/**
 * @classdesc item is the basic compose block of Kiwi
 */
export class item {
  // underlying file system node
  fnode: fs_node
  // properties defined in file header
  properties: { [name:string]: string }[]
  // raw file content
  raw_content: string
  uri: string
  // parsed <div> block
  parsed_content: string
  is_parsed: boolean
  childs: item[]
  constructor(node: fs_node) {
    this.fnode = node
    this.properties = []
    if (node.type === 'file') {
      this.raw_content = fs.readFileSync(node.absolute_path).toString()
      this.parsed_content = parse({content: this.raw_content, options: {type: 'md'}})
      this.is_parsed = true
    } else {
      this.raw_content = ''
      this.parsed_content = ''
      this.is_parsed = false
    }
    this.childs = []
    this.uri = ''
  }
}

export function build_item_tree(root_node: fs_node): item {
  let root_item = new item(root_node)
  for (let nd of root_node.childs) {
    root_item.childs.push(build_item_tree(nd))
  }
  return root_item
}
