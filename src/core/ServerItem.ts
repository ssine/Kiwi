import { BaseItem } from './BaseItem'
import { parse } from './Parser'
import { processRenderPlugin, ItemContext } from './Plugin'
import { Readable } from 'stream'

export interface ServerItem extends BaseItem {
  // always present for binary items
  getContentStream?: () => Readable
  // present for binary item whose content is stored as file
  contentFilePath?: string
}

export const renderItem = async (uri: string, item: ServerItem): Promise<void> => {
  item.renderedHTML = parse({
    input: await processRenderPlugin(uri, item.content || '', new ItemContext(uri)),
    uri: uri,
    type: item.type,
  })
  item.renderSync = true
}
