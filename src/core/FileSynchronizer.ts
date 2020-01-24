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
import { promisify } from 'util'
import * as moment from 'moment'
import { safeLoad as loadYaml, dump as dumpYaml } from 'js-yaml' 
import { ItemHeader } from './BaseItem'
import { ServerItem } from './ServerItem'
import { getMIMEFromExtension, renderableMIME, getExtensionFromMIME } from './Common'
import { getLogger } from './log'

const logger = getLogger('fs')

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

  constructor(nodePath: string) {
    this.absolutePath = path.resolve(nodePath)
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
  rootPath: string = ''
  fileTree: FSNode | null = null
  systemFileTree: FSNode | null = null
  itemTree: ServerItem | null = null
  systemItemTree: ServerItem | null = null

  async init(rootPath: string) {
    this.rootPath = path.resolve(rootPath)
    this.fileTree = await this.buildFileTreeFromPath(rootPath)
    this.systemFileTree = await this.buildFileTreeFromPath(path.resolve(__dirname, '../kiwi'))
  }

  async getItemTree(): Promise<ServerItem> {
    if (this.fileTree === null) throw 'Synchronizer not initialized!'
    this.itemTree = await this.buildItemTreeFromNode(this.fileTree)
    if (! this.itemTree) {
      logger.error('cannot parse item from root node!')
      throw 'cannot parse item from root node!'
    }
    return this.itemTree
  }
  
  async getSystemItemTree(): Promise<ServerItem> {
    if (this.systemFileTree === null) throw 'Synchronizer not initialized!'
    this.systemItemTree = await this.buildItemTreeFromNode(this.systemFileTree)
    if (! this.systemItemTree) {
      logger.error('cannot parse item from root node!')
      throw 'cannot parse item from root node!'
    }
    return this.systemItemTree
  }

  async writeFile(filePath: string, content: string) {
    const folder = path.resolve(filePath, '..')
    if (! await promisify(fs.exists)(folder)) {
      await fs.promises.mkdir(folder, { recursive: true })
    }
    await fs.promises.writeFile(filePath, content)
  }

  /**
   * Save an item back.
   * Just write back if the uri has not changed.
   * If the uri is changed or there is no file node, create one.
   */
  async saveItem(item: ServerItem) {
    let filePath = ''
    if (item.fnode === null) {
      // create a new file
      filePath = path.resolve(this.rootPath, item.uri)
      if (!!item.type && renderableMIME.has(item.type)) {
        filePath += '.' + getExtensionFromMIME(item.type)
      }
    } else {
      filePath = item.fnode.absolutePath
    }
    let fileString = `---\n${
      dumpYaml({
        title: item.title,
        ...item.headers
      }).trim()
    }\n---\n\n` + item.content.trim() + '\n'
    await this.writeFile(filePath, fileString)
  }

  async deleteItem() {

  }

  private async buildFileTreeDFS(node: FSNode) {
    if (node.type === 'file') return
    const childs = await fs.promises.readdir(node.absolutePath)
    for (let childPath of childs) {
      const child = new FSNode(path.join(node.absolutePath, childPath))
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

  private async getItemFromNode(node: FSNode): Promise<ServerItem | null> {
    let currentItem = new ServerItem()
    let rawContent: string
    if (node.type === 'file') {
      rawContent = (await fs.promises.readFile(node.absolutePath)).toString()
    } else {
      rawContent = ''
    }
    [currentItem.headers, currentItem.content] = this.splitHeaderContent(rawContent)
    if (!currentItem.type)
      currentItem.type = getMIMEFromExtension(node.path.ext)
    if (!currentItem.headers["title"])
      currentItem.headers["title"] = node.path.name
    currentItem.title = currentItem.headers["title"]
    currentItem.headers.tags = []
    currentItem.parsedContent = '<p>Content not parsed</p>'
    currentItem.isContentParsed = false
    currentItem.childs = []
    currentItem.uri = ''
    currentItem.missing = false
    currentItem.fnode = node
    return currentItem
  }
  
  private async buildItemTreeFromNode(rootNode: FSNode): Promise<ServerItem | null> {
    const rootItem = await this.getItemFromNode(rootNode)
    if (!rootItem) return null
    for (const nd of rootNode.childs) {
      const child = await this.buildItemTreeFromNode(nd)
      if (!! child)
        rootItem.childs.push(child)
    }
    return rootItem
  }
}

export {
  FSNode,
  FileSynchronizer
}
