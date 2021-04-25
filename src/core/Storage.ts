/**
 * Storage modules provide a two way mapping between an item and its serialized representation.
 */
import { Readable } from 'stream'

type Node = {
  meta: Record<string, any>
  content: string
  getReadStream(): Readable
}

interface StorageProvider {
  /**
   * aaa
   */
  a(): void
}

export { Node, StorageProvider }
