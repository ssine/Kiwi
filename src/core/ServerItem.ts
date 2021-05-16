import { BaseItem } from './BaseItem'
import { Readable } from 'stream'

export interface ServerItem extends BaseItem {
  // always present for binary items
  getContentStream?: () => Readable
  // present for binary item whose content is stored as file
  contentFilePath?: string
}
