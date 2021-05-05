/**
 * Storage modules provide a two way mapping between an item and its serialized representation.
 */
import { Readable } from 'stream'
import { isBinaryType, MIME } from './MimeType'
import { ServerItem } from './ServerItem'

interface StorageProvider {
  /**
   * Provider dependent initialization
   */
  init: (...args: any[]) => Promise<void>

  /**
   * Get an item with uri (null if not exist)
   */
  getItem: (uri: string) => Promise<ServerItem | null>

  /**
   * Put an item to storage
   */
  putItem: (uri: string, item: ServerItem) => Promise<void>

  /**
   * Delete an item from storage, all the child items gets deleted too.
   */
  deleteItem: (uri: string) => Promise<void>

  /**
   * Get a mapping from uri to items of all items
   */
  getAllItems: () => Promise<Record<string, ServerItem>>

  /**
   * Rename an existing item, optional
   */
  renameItem?: (fromUri: string, toUri: string) => Promise<void>
}

type Node = {
  type: MIME // MIME type of node content
  meta: Record<string, any> // a kv storage associated with node
  content?: string // text content of non-binary node
  getReadStream?: () => Readable // function to get readable stream of binary node
  contentFilePath?: string // optional file path of binary node
}

const nodeToItem = (uri: string, node: Node): ServerItem => {
  const item = {
    title: node.meta['title'] || uri.split('/').pop(),
    type: node.type,
    header: {
      ...node.meta,
      title: undefined,
    },
    content: node.content || '',
    renderedHTML: '',
    renderSync: false,
  }
  if (isBinaryType(node.type)) {
    return {
      ...item,
      getContentStream: node.getReadStream,
      contentFilePath: node.contentFilePath,
    }
  } else {
    return {
      ...item,
      content: node.content,
    }
  }
}

const itemToNode = (item: ServerItem): Node => {
  return {
    type: item.type,
    meta: {
      title: item.title,
      ...item.header,
    },
    content: item.content,
    getReadStream: item.getContentStream,
  }
}

export { Node, StorageProvider, nodeToItem, itemToNode }
