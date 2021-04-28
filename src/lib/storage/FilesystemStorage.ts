import * as fs from 'fs'
import { isBinaryFile } from 'isbinaryfile'
import { safeLoad as loadYaml, dump as dumpYaml } from 'js-yaml'
import * as path from 'path'
import { BaseItem, ItemHeader } from '../../core/BaseItem'
import { getExtensionFromMIME, getMIMEFromExtension, renderableMIME } from '../../core/Common'
import {
  getMimesWhichPropIncludes,
  getTypeFromFileExt,
  isContentType,
  isMimePropIncludes,
  MIME,
} from '../../core/MimeType'
import { StorageProvider } from '../../core/Storage'

class FilesystemStorage implements StorageProvider {
  async getItem(uri: string): Promise<BaseItem | null> {
    const path = uriTypeToPath(uri)
    return null
  }
}

/**
 * Construct a one-one mapping between (uri, type) and file path.
 * URI structures are inherently tree shaped, however folders cannot hold contents, thus all the
 * non-leaf nodes are mapped to index.md in that folder, and the original [index] uri are mapped
 * to __index__.md, and so on.
 * @param uri a normalized uri
 * @param type mime type of content
 * @returns relative file path to save content in
 */
const uriTypeToPath = (rootPath: string, uri: string, type: MIME): string => {
  return path.resolve(rootPath, uri) + isContentType(type) ? `.${getExtensionFromMIME(type)}` : ''
}

const pathToItem = async (rootPath: string, filePath: string): BaseItem => {
  const buffer = await fs.promises.readFile(filePath)
  // infer binary / text from file content
  const isBinary = await isBinaryFile(buffer)

  const parsedPath = path.parse(filePath)
  const type = getTypeFromFileExt(parsedPath.ext) || (isBinary ? 'application/octet-stream' : 'text/plain')
  const target = path.join(parsedPath.dir, isContentType(type) ? parsedPath.base : parsedPath.name)
  const uri = path.resolve(rootPath, target).replace(/\\+/g, '/')

  if (isContentType(type)) {
    const [meta, content] = splitMetaAndContent(buffer.toString())
  } else {
    let meta = {}
    try {
      meta = JSON.parse((await fs.promises.readFile(`${filePath}.meta.json`)).toString())
    } catch (err1) {
      try {
        meta = loadYaml((await fs.promises.readFile(`${filePath}.meta.yaml`)).toString())
      } catch (err2) {
        console.log(`Failed to read meta file for ${filePath}: ${err1} | ${err2}`)
      }
    }
  }
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

export { FilesystemStorage }
