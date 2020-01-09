/**
 * Filesystems Adaption
 * 
 * The filesystem part is responsible for mapping between files and items.
 * Some interfaces should be exported:
 * 
 * Function to construct all the items from a root folder.
 * @todo Function to save modified / newly created / deleted items back.
 * @todo Function to notify the system on file / folder changes.
 * 
 * There is also rules when parsing and serializing items:
 * 
 * - headers
 *   - headers are stored in yaml format enclosed by two lines of '---' for text files
 *   - headers are stored in [filename].meta for binary files
 *   - headers can be inferred from other file attributes (creation time, modification time, etc)
 *   - automatic completion on save?
 * - contents
 *   - raw string after removing headers
 *   - provide a absolute path when the file is binary
 * 
 * @packageDocumentation
 */

import * as fs from "fs"
import * as path from "path"
import * as moment from 'moment'
import { safeLoad as load_yaml } from 'js-yaml' 
import { item_header } from './item'
import { server_item as item } from './server_item'
import { ext_to_content_type } from './common'

/**
 * fs_node class represents a file or a folder on local filesystem
 * 
 * Provides the ability to save changes back and notify file changes from filesystem
 */
class fs_node {
  /**
   * The absolute path of this file or folder
   */
  absolute_path: string
  /**
   * path object for convenience
   */
  path: path.ParsedPath
  type: 'file' | 'directory'
  /**
   * Child nodes when current node is a directory
   */
  childs: fs_node[]

  constructor(node_path: string) {
    this.absolute_path = path.resolve(node_path)
    this.path = path.parse(this.absolute_path)
    this.type = fs.lstatSync(this.absolute_path).isFile() ? 'file' : 'directory'
    this.childs = []
  }

  /**
   * Stringify the file tree using current node as root
   */
  toString(): string {
    return this.absolute_path + '\n' + this.childs.map(v => v.toString()).join('')
  }
}

async function build_file_tree_dfs(node: fs_node) {
  if (node.type === 'file') return
  const childs = await fs.promises.readdir(node.absolute_path)
  for (let child_path of childs) {
    let child = new fs_node(path.join(node.absolute_path, child_path))
    await build_file_tree_dfs(child)
    node.childs.push(child)
  }
}

/**
 * Build a tree representing the target folder
 */
async function build_file_tree_from_path(root_path: string): Promise<fs_node> {
  let root = new fs_node(root_path)
  await build_file_tree_dfs(root)
  return root
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

async function build_item_from_node(node: fs_node): Promise<item> {
  let cur_item = new item()
  let raw_content: string
  if (node.type === 'file') {
    raw_content = (await fs.promises.readFile(node.absolute_path)).toString()
  } else if (node.type === 'directory' && node.childs.map(v => v.path.name).indexOf('index') != -1) {
    let idx = node.childs.map(v => v.path.name).indexOf('index')
    raw_content = (await fs.promises.readFile(node.childs[idx].absolute_path)).toString()
  } else {
    raw_content = ''
  }
  [cur_item.headers, cur_item.content] = split_item_header(raw_content)
  if (!cur_item.type)
    cur_item.type = ext_to_content_type(node.path.ext)
  if (!cur_item.headers["title"])
    cur_item.headers["title"] = node.path.name
  cur_item.title = cur_item.headers["title"]
  cur_item.parsed_content = '<p>Content not parsed</p>'
  cur_item.content_parsed = false
  cur_item.childs = []
  cur_item.uri = ''
  return cur_item
}

async function build_item_tree_from_node(root_node: fs_node): Promise<item> {
  let root_item = await build_item_from_node(root_node)
  for (let nd of root_node.childs) {
    root_item.childs.push(await build_item_tree_from_node(nd))
  }
  return root_item
}

/**
 * Construct a tree of all items under root path
 */
async function build_item_tree_from_path(root_path: string): Promise<item> {
  let root_node = await build_file_tree_from_path(root_path)
  let root_item = await build_item_tree_from_node(root_node)
  return root_item
}

export {
  build_item_tree_from_path
}
