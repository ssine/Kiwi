/**
 * Storage modules provide a two way mapping between an item and its serialized representation.
 */
import { Readable } from 'stream'
import { BaseItem } from './BaseItem'
import { MIME } from './Common'

type Node = {
  type: MIME // MIME type of node content
  meta: Record<string, any> // a kv storage associated with node
  content?: string // text content of non-binary node
  getReadStream?: () => Readable // function to get readable stream of binary node
}

interface StorageProvider {
  getItem: (uri: string) => Promise<BaseItem | null>
  putItem: (uri: string, item: BaseItem) => Promise<void>
  deleteItem: (uri: string) => Promise<void>
  getAllItems: () => Promise<Record<string, BaseItem>>
}

export { Node, StorageProvider }
