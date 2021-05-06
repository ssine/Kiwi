import { Readable } from 'node:stream'
import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { isBinaryFile } from 'isbinaryfile'
import { safeLoad as loadYaml, dump as dumpYaml } from 'js-yaml'
import { getFileExtFromType, getTypeFromFileExt, isBinaryType, isContentType, MIME } from '../../core/MimeType'
import { ServerItem } from '../../core/ServerItem'
import { itemToNode, nodeToItem, StorageProvider } from '../../core/Storage'
import { getLogger } from '../../core/Log'
import { InvalidURIError } from '../../core/Error'
const exists = promisify(fs.exists)

const logger = getLogger('filesystem')

class FilesystemStorage implements StorageProvider {
  rootPath: string
  prefix: string
  allItems: Record<string, ServerItem>

  constructor(rootPath: string, prefix: string = '') {
    this.rootPath = rootPath
    this.prefix = prefix
    this.allItems = {}
  }

  async init(): Promise<void> {
    this.allItems = await getAllItems(this.rootPath, this.prefix)
  }

  async getItem(uri: string): Promise<ServerItem | null> {
    return this.allItems[uri]
  }

  async putItem(uri: string, item: ServerItem): Promise<ServerItem> {
    return (this.allItems[uri] = await saveItem(this.rootPath, uri, item))
  }

  async deleteItem(uri: string): Promise<void> {
    if (this.allItems[uri]) {
      await deleteItem(this.rootPath, uri, this.allItems[uri].type)
      delete this.allItems[uri]
    }
  }

  async getAllItems(): Promise<Record<string, ServerItem>> {
    return this.allItems
  }
}

/**
 * Construct a one-one mapping between (uri, type) and file path.
 * URI structures are inherently tree shaped, however folders cannot hold contents, thus all the
 * non-leaf nodes are mapped to index.md in that folder, and the original [index] uri are mapped
 * to __index__.md, and so on.
 * @param uri a normalized uri
 * @param type mime type of content
 * @returns file path to save content in
 */
const uriTypeToPath = (rootPath: string, uri: string, type: MIME): string => {
  const absPath = path.resolve(rootPath, uri)
  if (isContentType(type)) {
    return `${absPath}.${getFileExtFromType(type)}`
  } else {
    const ext = path.parse(absPath).ext.substr(1)
    if (getTypeFromFileExt(ext) !== type) {
      // we cannot guarantee a same mime type to be inferred in this situation
      throw new InvalidURIError(`Mime type ${type} cannot be inferred from uri extension .${ext}`)
    } else {
      return absPath
    }
  }
}

const pathToUriType = async (rootPath: string, filePath: string): Promise<[string, MIME]> => {
  const parsedPath = path.parse(filePath)
  const type =
    getTypeFromFileExt(parsedPath.ext.substr(1)) ||
    ((await isBinaryFile(filePath)) ? 'application/octet-stream' : 'text/plain')
  const target = path.join(parsedPath.dir, isContentType(type) ? parsedPath.name : parsedPath.base)
  const uri = path.relative(rootPath, target).replace(/\\+/g, '/')
  return [uri, type]
}

const saveItem = async (rootPath: string, uri: string, item: ServerItem): Promise<ServerItem> => {
  const filePath = uriTypeToPath(rootPath, uri, item.type)
  const node = itemToNode(item)
  const folder = path.resolve(filePath, '..')
  if (!(await exists(folder))) {
    await fs.promises.mkdir(folder, { recursive: true })
  }
  if (isContentType(item.type)) {
    await fs.promises.writeFile(filePath, `---\n${dumpYaml(node.meta).trim()}\n---\n\n${node.content}`)
  } else {
    await fs.promises.writeFile(`${filePath}.meta.yaml`, dumpYaml(node.meta))
    if (isBinaryType(item.type)) {
      await streamToFile(node.getReadStream!(), filePath)
    } else {
      await fs.promises.writeFile(filePath, node.content!)
    }
  }
  return (await pathToUriItem(rootPath, filePath))[1]
}

const deleteItem = async (rootPath: string, uri: string, type: MIME, withChild = false): Promise<void> => {
  const filePath = uriTypeToPath(rootPath, uri, type)

  await fs.promises.rm(filePath, { force: true })
  if (!isContentType(type)) {
    await fs.promises.rm(`${filePath}.meta.yaml`, { force: true })
    await fs.promises.rm(`${filePath}.meta.json`, { force: true })
  }

  if (withChild && isContentType(type)) {
    // content typed items may have children, remove them
    const parsed = path.parse(filePath)
    await fs.promises.rm(path.join(parsed.dir, parsed.base), { recursive: true, force: true })
  }

  // remove all empty parents
  let parent = path.resolve(filePath, '../')
  let parentFiles = await fs.promises.readdir(parent)
  while (parentFiles.length === 0 && path.relative(rootPath, parent) !== '') {
    await fs.promises.rmdir(parent)
    parent = path.resolve(parent, '../')
    parentFiles = await fs.promises.readdir(parent)
  }
}

const pathToUriItem = async (rootPath: string, filePath: string): Promise<[string, ServerItem]> => {
  const [uri, type] = await pathToUriType(rootPath, filePath)
  let meta = {}
  let content, getReadStream
  if (isContentType(type)) {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;[meta, content] = splitMetaAndContent((await fs.promises.readFile(filePath)).toString())
  } else {
    // get meta
    try {
      meta = loadYaml((await fs.promises.readFile(`${filePath}.meta.yaml`)).toString())
    } catch (err1) {
      try {
        meta = JSON.parse((await fs.promises.readFile(`${filePath}.meta.json`)).toString())
      } catch (err2) {
        if (err1.code === 'ENOENT' && err2.code === 'ENOENT') {
          logger.debug(`Meta file (*.meta.yaml or *.meta.json) for ${filePath} not exists`)
        } else {
          logger.info(`Failed to read meta file for ${filePath}: ${err1} ${err2}`)
        }
      }
    }
    // get content
    if (isBinaryType(type)) {
      getReadStream = () => fs.createReadStream(filePath)
    } else {
      content = (await fs.promises.readFile(filePath)).toString()
    }
  }
  return [uri, nodeToItem(uri, { type, meta, content, getReadStream, contentFilePath: filePath })]
}

const getAllItems = async (rootPath: string, uriPrefix: string): Promise<Record<string, ServerItem>> => {
  const items: Record<string, ServerItem> = {}
  const dfs = async (nodePath: string) => {
    const stat = await fs.promises.lstat(nodePath)
    if (stat.isFile()) {
      const [uri, item] = await pathToUriItem(rootPath, nodePath)
      items[`${uriPrefix}${uri}`] = item
    } else if (stat.isDirectory()) {
      await Promise.all((await fs.promises.readdir(nodePath)).map(p => dfs(path.resolve(nodePath, p))))
    }
  }
  await dfs(rootPath)
  return items
}

const splitMetaAndContent = (raw: string): [Record<string, any>, string] => {
  const lines = raw.replace(/\r/g, '').split('\n')
  let meta = {}
  let divideIndex = 0
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        meta = loadYaml(lines.slice(1, i).join('\n'))

        if (lines[i + 1] === '') divideIndex = i + 2
        else divideIndex = i + 1
        break
      }
    }
  }
  return [meta, lines.slice(divideIndex).join('\n')]
}

const streamToFile = (inputStream: Readable, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(filePath)
    inputStream.pipe(fileWriteStream).on('finish', resolve).on('error', reject)
  })
}

export { FilesystemStorage }
