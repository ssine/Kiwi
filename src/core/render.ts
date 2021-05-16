import { parse } from './Parser'
import { ItemContext, processRenderPlugin } from './Plugin'
import { ServerItem } from './ServerItem'

export const renderItem = async (uri: string, item: ServerItem): Promise<void> => {
  item.renderedHTML = parse({
    input: await processRenderPlugin(uri, item.content || '', new ItemContext(uri)),
    uri: uri,
    type: item.type,
  })
  item.renderSync = true
}
