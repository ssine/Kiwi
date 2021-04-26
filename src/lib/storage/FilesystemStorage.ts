import { BaseItem } from '../../core/BaseItem'
import { StorageProvider } from '../../core/Storage'

class FilesystemStorage implements StorageProvider {
  async getItem(uri: string): Promise<BaseItem | null> {
    const path = uriToPath(uri)
    return null
  }
}

const uriToPath = (uri: string): string => {
  return uri
}

export { FilesystemStorage }
