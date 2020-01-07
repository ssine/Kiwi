import * as fs from 'fs'
import * as moment from 'moment'
import { safeLoad as load_yaml } from 'js-yaml' 
import { fs_node } from './file'
import { parse } from './parser'
import { ext_to_content_type } from './common'

type item_header = {
  'title'?: string
  'author'?: string
  'create-time'?: moment.Moment
  'modify-time'?: moment.Moment
  'content-type'?: string
}

function split_item_header(raw: string): [item_header, string] {
  let lst = raw.split(/\r\n|\n/)
  if (lst[0] === '---') {
    for (let i = 1; i < lst.length; i++) {
      if (lst[i] === '---') {
        let headers = load_yaml(lst.slice(1, i).join('\n'))
        if ('create-time' in headers) headers['create-time'] = moment(headers['create-time'])
        if ('modify-time' in headers) headers['modify-time'] = moment(headers['modify-time'])
        return [headers, lst.slice(i+1).join('\n')]
      }
    }
    return [{}, lst.join('\n')]
  } else {
    return [{}, lst.join('\n')]
  }
}

/**
 * @classdesc item is the basic compose block of Kiwi
 */
export class item {
  // underlying file system node
  fnode: fs_node
  childs: item[]
  // properties defined in file header
  headers: item_header
  // raw file content
  content: string
  // parsed <div> block
  parsed_content: string
  is_parsed: boolean
  uri: string

  constructor(node: fs_node) {
    this.fnode = node
    let raw_content: string
    if (node.type === 'file') {
      raw_content = fs.readFileSync(node.absolute_path).toString()
    } else if (node.type === 'directory' && node.childs.map(v => v.path.name).indexOf('index') != -1) {
      let idx = node.childs.map(v => v.path.name).indexOf('index')
      raw_content = fs.readFileSync(node.childs[idx].absolute_path).toString()
    } else {
      raw_content = ''
    }
    [this.headers, this.content] = split_item_header(raw_content)
    if (!this.headers["content-type"])
      this.headers["content-type"] = ext_to_content_type(this.fnode.path.ext)
    if (!this.headers["title"])
      this.headers["title"] = this.fnode.path.name
    this.parsed_content = '<p>Content not parsed</p>'
    this.is_parsed = false
    this.childs = []
    this.uri = ''
  }

  parse() {
    this.parsed_content = parse(this.content, this.headers["content-type"] || 'md')
    this.is_parsed = true
  }

  render() {
    if (!this.is_parsed)
      this.parse()
    return this.parsed_content
  }
}

export function build_item_tree(root_node: fs_node): item {
  let root_item = new item(root_node)
  for (let nd of root_node.childs) {
    root_item.childs.push(build_item_tree(nd))
  }
  return root_item
}
