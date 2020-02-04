/**
 * Filesystems Adaption
 * 
 * The filesystem part is responsible for the mapping between files and items.
 * Main functions include:
 * 
 * Construct all the items from a root folder.
 * Save modified / newly created / deleted items back.
 * @todo Notify the system on file / folder changes.
 * 
 * Rules when parsing and serializing items:
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

export type URIItemMap = Record<string, ServerItem>

class FileSynchronizer {
  rootPath: string = ''
  fileTree: FSNode | null = null
  systemFileTree: FSNode | null = null
  /**
   * Temp variable, the map belongs to item manager, don't use it.
   */
  URIMap: URIItemMap = {}
  itemNodeMap: Map<ServerItem, FSNode> = new Map()

  async init(rootPath: string) {
    this.rootPath = path.resolve(rootPath)
  }

  async getItemMap(): Promise<Record<string, ServerItem>> {
    const fileTree = await this.buildFileTreeFromPath(this.rootPath)
    this.URIMap = {}
    await this.parseFileTreeToMap(fileTree, '')
    return this.URIMap
  }

  async getSystemItemMap(): Promise<Record<string, ServerItem>> {
    const systemFileTree = await this.buildFileTreeFromPath(path.resolve(__dirname, '../kiwi'))
    this.URIMap = {}
    await this.parseFileTreeToMap(systemFileTree, '$kiwi/')
    return this.URIMap
  }

  /**
   * Save an item back.
   * Just write back if the uri has not changed.
   * If the uri is changed or there is no file node, create one.
   */
  async saveItem(item: ServerItem) {
    let filePath = ''
    const fnode = this.itemNodeMap.get(item)
    if (fnode === undefined) {
      // create a new file
      filePath = path.resolve(this.rootPath, item.uri)
      if (!!item.type && renderableMIME.has(item.type)) {
        filePath += '.' + getExtensionFromMIME(item.type)
      }
      logger.debug(`file not exist, creating new file [${filePath}]`)
    } else {
      filePath = fnode.absolutePath
    }
    let fileString = `---\n${
      dumpYaml({
        title: item.title,
        ...item.headers
      }).trim()
    }\n---\n\n` + item.content.trim() + '\n'
    await this.writeFile(filePath, fileString)
    logger.info(`item content written to [${filePath}]`)
    if (fnode === null) {
      this.itemNodeMap.set(item, new FSNode(filePath))
    }
  }

  async deleteItem(item: ServerItem) {
    const fnode = this.itemNodeMap.get(item)
    if (fnode === undefined) {
      logger.warn(`Item to delete [${item.title}] do not have a corresponding file!`)
      return
    }
    await this.removeWithEmptyParents(fnode.absolutePath)
    logger.debug(`file [${fnode.absolutePath}] deleted`)
  }

  private async writeFile(filePath: string, content: string) {
    const folder = path.resolve(filePath, '..')
    if (! await promisify(fs.exists)(folder)) {
      await fs.promises.mkdir(folder, { recursive: true })
    }
    await fs.promises.writeFile(filePath, content)
  }

  /**
   * Remove a file together with its empty parents after removing
   */
  private async removeWithEmptyParents(filePath: string) {
    await fs.promises.unlink(filePath)
    while (true) {
      const parent = path.resolve(filePath, '../')
      const files = await fs.promises.readdir(parent)
      if (files.length === 0) {
        await fs.promises.rmdir(parent)
        logger.debug(`folder ${parent} deleted because of empty`)
        filePath = parent
      } else {
        break
      }
    }
  }

  private async buildFileTreeFromPath(rootPath: string): Promise<FSNode> {
    const buildFileTreeDFS = async (node: FSNode) => {
      if (node.type === 'file') return
      const childs = await fs.promises.readdir(node.absolutePath)
      for (let childPath of childs) {
        const child = new FSNode(path.join(node.absolutePath, childPath))
        await buildFileTreeDFS(child)
        node.childs.push(child)
      }
    }
    const root = new FSNode(rootPath)
    await buildFileTreeDFS(root)
    return root
  }

  private splitHeaderContent(raw: string): [ItemHeader & {title?: string}, string] {
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

  private async getItemFromNode(node: FSNode, uriPrefix: string): Promise<ServerItem | null> {
    let currentItem = new ServerItem()
    let rawContent: string
    if (node.type === 'file') {
      rawContent = (await fs.promises.readFile(node.absolutePath)).toString()
    } else {
      rawContent = ''
    }
    const [headers, content] = this.splitHeaderContent(rawContent)
    currentItem.headers = headers
    currentItem.content = content
    currentItem.type = getMIMEFromExtension(node.path.ext)
    currentItem.title = headers["title"] || node.path.name
    currentItem.headers.tags = []
    currentItem.parsedContent = '<p>Content not parsed</p>'
    currentItem.isContentParsed = false
    currentItem.childs = []
    if (headers.uri) {
      logger.info(`Custom URI [${headers.uri}] supressed default one for [${currentItem.title}].`)
      currentItem.uri = headers.uri
    } else {
      const localURI = currentItem.type && renderableMIME.has(currentItem.type) ? node.path.name : node.path.base
      currentItem.uri = `${uriPrefix}${localURI}`
      logger.debug(`Assign URI [${currentItem.uri}] to item [${currentItem.title}].`)
    }
    currentItem.missing = false
    this.itemNodeMap.set(currentItem, node)
    return currentItem
  }
  
  private async parseFileTreeToMap(rootNode: FSNode, prefix: string): Promise<void> {
    const rootItem = await this.getItemFromNode(rootNode, prefix)
    if (!rootItem) return
    this.URIMap[rootItem.uri] = rootItem
    await Promise.all(rootNode.childs.map(nd => this.parseFileTreeToMap(nd, `${rootItem.uri}/`)))
    return
  }
}

export {
  FSNode,
  FileSynchronizer
}
