import { MIME } from './MimeType'

export type ItemHeader = {
  author?: string
  createTime?: number
  modifyTime?: number
  reader?: string[]
  writer?: string[]
  tags?: string[]
} & Record<string, any>

export interface BaseItem {
  title: string
  type: MIME
  header: ItemHeader
  content?: string
}
