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
import { safeLoad as loadYaml, dump as dumpYaml } from 'js-yaml' 
import { ItemHeader } from './BaseItem'
import { ServerItem } from './ServerItem'
import { getMIMEFromExtension } from './Common'

/**
 * FSNode class represents a file or a folder on local filesystem
 * 
 * Provides the ability to save changes back and notify file changes from filesystem
 */
class FSNode {
  /**
   * The absolute path of this file or folder
   */
  absolutePath: string
  /**
   * path object for convenience
   */
  path: path.ParsedPath
  type: 'file' | 'directory'
  /**
   * Child nodes when current node is a directory
   */
  childs: FSNode[]

  constructor(node_path: string) {
    this.absolutePath = path.resolve(node_path)
    this.path = path.parse(this.absolutePath)
    this.type = fs.lstatSync(this.absolutePath).isFile() ? 'file' : 'directory'
    this.childs = []
  }

  /**
   * Stringify the file tree using current node as root
   */
  toString(): string {
    return this.absolutePath + '\n' + this.childs.map(v => v.toString()).join('')
  }
}

class FileSynchronizer {
  fileTree: FSNode | null = null
  systemFileTree: FSNode | null = null
  itemTree: ServerItem | null = null
  systemItemTree: ServerItem | null = null

  async init(rootPath: string) {
    this.fileTree = await this.buildFileTreeFromPath(rootPath)
    this.systemFileTree = await this.buildFileTreeFromPath(path.resolve(__dirname, '../kiwi'))
  }

  async getItemTree(): Promise<ServerItem> {
    if (this.fileTree === null) throw 'Synchronizer not initialized!'
    this.itemTree = await this.buildItemTreeFromNode(this.fileTree)
    return this.itemTree
  }
  
  async getSystemItemTree(): Promise<ServerItem> {
    if (this.systemFileTree === null) throw 'Synchronizer not initialized!'
    this.systemItemTree = await this.buildItemTreeFromNode(this.systemFileTree)
    return this.systemItemTree
  }

  /**
   * Save an item back.
   * Just write back if the uri has not changed.
   * If the uri is changed or there is no file node, create one.
   */
  async saveItem(item: ServerItem) {
    if (item.fnode !== null) {
      // save back to existing file
      let fd = await fs.promises.open(item.fnode.absolutePath, 'w')
      let file_str = `---\n${
        dumpYaml({
          title: item.title,
          ...item.headers
        }).trim()
      }\n---\n\n` + item.content.trim() + '\n'
      await fd.write(file_str)
      await fd.close()
    } else {
      // create a new file
    }
  }

  async deleteItem() {

  }

  private async buildFileTreeDFS(node: FSNode) {
    if (node.type === 'file') return
    const childs = await fs.promises.readdir(node.absolutePath)
    for (let child_path of childs) {
      const child = new FSNode(path.join(node.absolutePath, child_path))
      await this.buildFileTreeDFS(child)
      node.childs.push(child)
    }
  }
  
  private async buildFileTreeFromPath(rootPath: string): Promise<FSNode> {
    const root = new FSNode(rootPath)
    await this.buildFileTreeDFS(root)
    return root
  }

  private splitHeaderContent(raw: string): [ItemHeader, string] {
    const lines = raw.replace(/\r/g, '').split('\n')
    let headers: ItemHeader = {}
    let divideIndex = 0
    if (lines[0] === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          headers = loadYaml(lines.slice(1, i).join('\n'))
          if ('create-time' in headers) headers['create-time'] = moment(headers['create-time'])
          if ('modify-time' in headers) headers['modify-time'] = moment(headers['modify-time'])

          if (lines[i + 1] === '') divideIndex = i + 2
          else divideIndex = i + 1
          break
        }
      }
    }
    return [headers, lines.slice(divideIndex).join('\n')]
  }

  private async getItemFromNode(node: FSNode): Promise<ServerItem> {
    let cur_item = new ServerItem()
    let raw_content: string
    if (node.type === 'file') {
      raw_content = (await fs.promises.readFile(node.absolutePath)).toString()
    } else if (node.type === 'directory' && node.childs.map(v => v.path.name).indexOf('index') != -1) {
      let idx = node.childs.map(v => v.path.name).indexOf('index')
      raw_content = (await fs.promises.readFile(node.childs[idx].absolutePath)).toString()
    } else {
      raw_content = ''
    }
    [cur_item.headers, cur_item.content] = this.splitHeaderContent(raw_content)
    if (!cur_item.type)
      cur_item.type = getMIMEFromExtension(node.path.ext)
    if (!cur_item.headers["title"])
      cur_item.headers["title"] = node.path.name
    cur_item.title = cur_item.headers["title"]
    cur_item.parsed_content = '<p>Content not parsed</p>'
    cur_item.content_parsed = false
    cur_item.childs = []
    cur_item.uri = ''
    cur_item.missing = false
    cur_item.fnode = node
    return cur_item
  }
  
  private async buildItemTreeFromNode(rootNode: FSNode): Promise<ServerItem> {
    let rootItem = await this.getItemFromNode(rootNode)
    for (let nd of rootNode.childs) {
      rootItem.childs.push(await this.buildItemTreeFromNode(nd))
    }
    return rootItem
  }
}

export {
  FSNode,
  FileSynchronizer
}
