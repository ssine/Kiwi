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

import * as fs from 'fs'
import * as path from 'path'
import {promisify} from 'util'
import * as moment from 'moment'
import {safeLoad as loadYaml, dump as dumpYaml} from 'js-yaml'
import {ItemHeader} from './BaseItem'
import {ServerItem} from './ServerItem'
import {getMIMEFromExtension, renderableMIME, getExtensionFromMIME, sleep, fixedEncodeURIComponent} from './Common'
import {getLogger} from './Log'
import * as chokidar from 'chokidar'
import {isBinaryFile} from 'isbinaryfile'
import {itemRouteTable} from './server'

const logger = getLogger('fs')

/**
 * FSNode represents a file or a folder on local filesystem
 *
 * Provides the ability to save changes back and notify file changes from filesystem
 */
type FSNode = {
  /**
   * The absolute path of this file or folder
   */
  absolutePath: string
  /**
   * path object for convenience
   */
  path: path.ParsedPath
  type: 'file' | 'directory'
}

async function getFSNode(nodePath: string): Promise<FSNode> {
  return {
    absolutePath: path.resolve(nodePath),
    path: path.parse(nodePath),
    type: (await fs.promises.lstat(nodePath)).isFile() ? 'file' : 'directory',
  }
}

export type URIItemMap = Record<string, ServerItem>

type SynchronizerCallback = (item: ServerItem) => void

type SynchronizerCallbacks = {
  onItemCreate?: SynchronizerCallback
  onItemDelete?: SynchronizerCallback
  onItemChange?: SynchronizerCallback
}

const options: {usePolling: boolean} = {
  usePolling: false,
}

class FileSynchronizer {
  rootPath = ''
  watcher: chokidar.FSWatcher | null = null
  callbacks: SynchronizerCallbacks | null = null
  itemPathMap: Map<ServerItem, string> = new Map()
  pathItemMap: Map<string, ServerItem> = new Map()

  init(rootPath: string, callbacks: SynchronizerCallbacks) {
    this.rootPath = path.resolve(rootPath)
    this.callbacks = callbacks
    this.watcher = chokidar.watch(this.rootPath, {
      ignoreInitial: true,
      awaitWriteFinish: {stabilityThreshold: 1100},
      usePolling: options.usePolling,
    })
    this.watcher.on('add', path => {
      this.onNodeCreated(path, false)
    })
    this.watcher.on('addDir', path => {
      this.onNodeCreated(path, true)
    })
    this.watcher.on('unlink', path => {
      this.onNodeDeleted(path, false)
    })
    this.watcher.on('unlinkDir', path => {
      this.onNodeDeleted(path, true)
    })
    this.watcher.on('change', path => {
      this.onNodeChanged(path)
    })
  }

  async getItemMap(): Promise<Record<string, ServerItem>> {
    const nodes = await this.getAllNodes(this.rootPath)
    const [URIMap, pathMap] = await this.parseNodesToItems(nodes, this.rootPath, '')
    Object.keys(pathMap).forEach(uri => {
      this.link(uri, pathMap[uri])
    })
    return URIMap
  }

  async getSystemItemMap(): Promise<Record<string, ServerItem>> {
    const systemPath = path.resolve(__dirname, '../kiwi')
    const nodes = await this.getAllNodes(systemPath)
    const [URIMap, pathMap] = await this.parseNodesToItems(nodes, systemPath, 'kiwi/')
    Object.keys(pathMap).forEach(uri => {
      // system items are read-only so do not save path info
      pathMap[uri].isSystem = true
    })
    return URIMap
  }

  /**
   * Save an item back.
   * Just write back if the uri has not changed.
   * If the uri is changed or there is no file node, create one.
   */
  async saveItem(item: ServerItem) {
    let filePath = this.itemPathMap.get(item)
    if (filePath === undefined) {
      // create a new file
      filePath = path.resolve(this.rootPath, item.uri)
      if (!!item.type && renderableMIME.has(item.type)) {
        filePath += '.' + getExtensionFromMIME(item.type)
      }
      logger.debug(`file not exist, creating new file [${filePath}]`)
    }
    let fileString = item.content.trim() + '\n'
    if (!!item.type && renderableMIME.has(item.type)) {
      fileString =
        `---\n${dumpYaml({
          title: item.title,
          ...item.headers,
        }).trim()}\n---\n\n` + fileString
    }
    await this.writeFile(filePath, fileString)
    logger.info(`item content written to [${filePath}]`)
    this.link(filePath, item)
  }

  async deleteItem(item: ServerItem) {
    const path = this.itemPathMap.get(item)
    if (path === undefined) {
      logger.warn(`Item to delete [${item.title}] do not have a corresponding file!`)
      return
    }
    await this.removeWithEmptyParents(path)
    this.unlink(path)
    logger.debug(`file [${path}] deleted`)
    const serveURI = fixedEncodeURIComponent(item.uri)
    if (serveURI in itemRouteTable) {
      delete itemRouteTable[serveURI]
      logger.debug(`stop serving ${serveURI}`)
    }
  }

  onNodeDeleted(path: string, isDir: boolean) {
    const item = this.pathItemMap.get(path)
    if (!item) {
      logger.warn(`deleted path ${path} don't have an item!`)
      return
    }
    logger.info(`path [${path}] deleted, syncing to item [${item.uri}]`)
    if (this.callbacks?.onItemDelete) {
      this.callbacks.onItemDelete(item)
    }
    this.unlink(path)
    const serveURI = fixedEncodeURIComponent(item.uri)
    if (serveURI in itemRouteTable) {
      delete itemRouteTable[serveURI]
      logger.debug(`stop serving ${serveURI}`)
    }
  }

  async onNodeCreated(nodePath: string, isDir: boolean) {
    if (this.pathItemMap.get(nodePath)) return
    const item = await this.getItemFromNode(await getFSNode(nodePath), this.rootPath, '')
    logger.debug(`created path [${nodePath}], new item [${item.uri}] generated`)
    this.link(nodePath, item)
    if (this.callbacks?.onItemCreate) {
      this.callbacks.onItemCreate(item)
    }
  }

  async onNodeChanged(path: string) {
    const item = this.pathItemMap.get(path)
    if (!item) {
      logger.warn(`changed path ${path} don't have an item!`)
      return
    }
    const newItem = await this.getItemFromNode(await getFSNode(path), this.rootPath, '')
    for (const k in newItem) {
      if (k !== 'uri')
        // @ts-ignore
        item[k] = newItem[k]
    }
    logger.info(`path [${path}] changed, syncing to item [${item.uri}]`)
    if (this.callbacks?.onItemChange) this.callbacks.onItemChange(item)
  }

  private async writeFile(filePath: string, content: string) {
    const exists = promisify(fs.exists)
    // get the topmost existing folder and unwatch it
    let tryPath = filePath
    let nextPath = path.resolve(tryPath, '..')
    const pathsToAdd = []
    while (!(await exists(nextPath))) {
      tryPath = nextPath
      nextPath = path.resolve(tryPath, '..')
      if (nextPath === tryPath) break
      pathsToAdd.push(tryPath)
    }
    if (tryPath.indexOf(this.rootPath) === -1) throw `topmost existing folder ${tryPath} goes beyond root!`
    this.watcher?.unwatch(tryPath)
    const folder = path.resolve(filePath, '..')
    if (!(await exists(folder))) {
      await fs.promises.mkdir(folder, {recursive: true})
    }
    await fs.promises.writeFile(filePath, content)
    this.watcher?.add(tryPath)
    pathsToAdd.forEach(p => this.onNodeCreated(p, true))
  }

  /**
   * Remove a path together with its empty parents after removing
   * If path is a dirsctory, remove all childs recursively.
   */
  private async removeWithEmptyParents(targetPath: string) {
    const rmdir = async (p: string) => {
      const childs = await fs.promises.readdir(p)
      for (const c of childs) {
        const child = path.resolve(p, c)
        if ((await fs.promises.stat(child)).isDirectory()) {
          await rmdir(child)
        } else {
          this.watcher?.unwatch(child)
          await fs.promises.unlink(child)
          // don't know why the fuck I have to delay this
          // maybe fs emits multiple delete events?
          setTimeout(() => {
            this.watcher?.add(child)
          }, 1000)
        }
      }
      this.watcher?.unwatch(p)
      await fs.promises.rmdir(p)
      setTimeout(() => {
        this.watcher?.add(p)
      }, 1000)
    }

    const node = await getFSNode(targetPath)
    if (node.type === 'file') {
      this.watcher?.unwatch(targetPath)
      await fs.promises.unlink(targetPath)
      setTimeout(() => {
        this.watcher?.add(targetPath)
      }, 1000)
      logger.info(`file [${targetPath}] removed`)
    } else {
      await rmdir(targetPath)
      logger.info(`folder [${targetPath}] removed with childs`)

      this.pathItemMap.forEach((v, p) => {
        if (p.startsWith(targetPath) && p !== targetPath) {
          this.onNodeDeleted(p, false)
        }
      })
    }

    // remove parents
    while (true) {
      const parent = path.resolve(targetPath, '../')
      const files = await fs.promises.readdir(parent)
      if (files.length === 0) {
        this.watcher?.unwatch(parent)
        await fs.promises.rmdir(parent)
        this.watcher?.add(parent)
        const parentItem = this.pathItemMap.get(parent)
        if (parentItem) {
          this.callbacks?.onItemDelete ? this.callbacks?.onItemDelete(parentItem) : null
          this.unlink(parent)
        }
        logger.info(`folder ${parent} deleted because of empty`)
        targetPath = parent
      } else {
        break
      }
    }
  }

  /**
   * Get all the folders and files recursively under rootPath
   */
  private async getAllNodes(rootPath: string): Promise<FSNode[]> {
    const list: FSNode[] = []
    const dfs = async (nodePath: string) => {
      const node = await getFSNode(nodePath)
      list.push(node)
      if (node.type === 'directory') {
        await Promise.all((await fs.promises.readdir(node.absolutePath)).map(p => dfs(path.resolve(nodePath, p))))
      }
      return
    }
    await dfs(rootPath)
    return list
  }

  /**
   * Given a list of FSNode, return:
   *   - map from uri to items
   *   - map from path to items
   */
  private async parseNodesToItems(
    nodes: FSNode[],
    rootPath: string,
    URIPrefix: string
  ): Promise<[URIItemMap, URIItemMap]> {
    const URIMap: URIItemMap = {}
    const pathMap: URIItemMap = {}

    await Promise.all(
      nodes.map(async node => {
        const item = await this.getItemFromNode(node, rootPath, URIPrefix)
        if (!item) return
        URIMap[item.uri] = item
        pathMap[node.absolutePath] = item
      })
    )

    return [URIMap, pathMap]
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

  /**
   * Pure function
   */
  private async getItemFromNode(node: FSNode, rootPath: string, URIPrefix: string): Promise<ServerItem> {
    const currentItem = new ServerItem()
    let rawContent: string
    if (node.type === 'file') {
      // wait until the coping is done?
      let buffer: Buffer | null = null
      try {
        buffer = await fs.promises.readFile(node.absolutePath)
      } catch (err) {
        if (err.code === 'EBUSY') {
          while (true) {
            await sleep(2000)
            let haveException = false
            try {
              buffer = await fs.promises.readFile(node.absolutePath)
            } catch (err) {
              haveException = true
            }
            if (!haveException) break
          }
        } else {
          logger.warn(`file reading error: ${err}`)
        }
      }
      if (buffer) {
        const isBinary = await isBinaryFile(buffer)
        if (isBinary) {
          currentItem.isContentEditable = false
          rawContent = ''
        } else {
          currentItem.isContentEditable = true
          rawContent = buffer.toString()
        }
      } else {
        rawContent = ''
      }
    } else {
      rawContent = ''
    }
    const [headers, content] = this.splitHeaderContent(rawContent)
    currentItem.headers = headers
    currentItem.content = content
    currentItem.type = getMIMEFromExtension(node.path.ext)
    currentItem.title = headers['title'] || node.path.name
    delete headers['title']
    if (!currentItem.headers.tags) currentItem.headers.tags = []
    currentItem.parsedContent = '<p>Content not parsed</p>'
    currentItem.isContentParsed = false
    currentItem.childs = []
    if (headers.uri) {
      logger.info(`Custom URI [${headers.uri}] supressed default one for [${currentItem.title}].`)
      currentItem.uri = headers.uri
    } else {
      const absURI = path.resolve(
        node.path.dir,
        currentItem.type && renderableMIME.has(currentItem.type) ? node.path.name : node.path.base
      )
      currentItem.uri = `${URIPrefix}${path.relative(rootPath, absURI).replace(/\\+/g, '/')}`
      logger.debug(`Assign URI [${currentItem.uri}] to item [${currentItem.title}].`)
    }
    // file with unrenderable type gets served
    if (node.type !== 'directory' && !(currentItem.type && renderableMIME.has(currentItem.type))) {
      itemRouteTable[fixedEncodeURIComponent(currentItem.uri)] = (req, res) => {
        res.sendFile(node.absolutePath)
      }
      logger.debug(`serve ${node.absolutePath} on uri [${fixedEncodeURIComponent(currentItem.uri)}]`)
    }
    currentItem.missing = false
    return currentItem
  }

  /**
   * construct linking between path and item
   */
  private link(path: string, item: ServerItem) {
    this.pathItemMap.set(path, item)
    this.itemPathMap.set(item, path)
  }

  /**
   * remove linking between node and item
   */
  private unlink(path: string) {
    const item = this.pathItemMap.get(path)
    if (!item) throw `path to unlink ${path} don't have an item!`
    this.pathItemMap.delete(path)
    this.itemPathMap.delete(item)
  }
}

export {FSNode, FileSynchronizer, options}
