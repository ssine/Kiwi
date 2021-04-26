import { BaseItem } from '../../core/BaseItem'
import { getExtensionFromMIME, MIME, renderableMIME } from '../../core/Common'
import { StorageProvider } from '../../core/Storage'

class FilesystemStorage implements StorageProvider {
  async getItem(uri: string): Promise<BaseItem | null> {
    const path = uriToPath(uri)
    return null
  }
}

/**
 * Construct a one-one mapping between uri and file path.
 * URI structures are inherently tree shaped, however folders cannot hold contents, thus all the
 * non-leaf nodes are mapped to index.md in that folder, and the original [index] uri are mapped
 * to __index__.md, and so on.
 * @param uri a normalized uri
 * @param type mime type of content
 * @returns file path to save content in
 */
const uriToPath = (uri: string, type: MIME): string => {
  let path = uri
  if (renderableMIME.has(type)) {
    path += `.${getExtensionFromMIME(type)}`
  }
  return uri
}

const pathToUri = (path: string): string => {
  let path = uri
  if (renderableMIME.has(type)) {
    path += `.${getExtensionFromMIME(type)}`
  }
  return uri
}

export { FilesystemStorage }
