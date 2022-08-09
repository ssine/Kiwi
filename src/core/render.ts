import { MainConfig } from './config'
import { isContentType } from './MimeType'
import { parse } from './Parser'
import { ItemContext, processRenderPlugin } from './plugin'
import { ServerItem } from './ServerItem'

const defaultContent = `{{list(all => all.filter(i => i[0].startsWith(kiwi.uri) && (i[0].slice(kiwi.uri.length).match(/\\//g) || []).length === 1))}}`

export const renderItem = async (uri: string, item: ServerItem, config: MainConfig): Promise<void> => {
  const content = item.content || ''
  const input =
    content.trim().length === 0 && !item.header.noPlaceholderList && isContentType(item.type) ? defaultContent : content
  item.renderedHTML = parse({
    input: await processRenderPlugin(uri, input, new ItemContext(uri, config)),
    uri: uri,
    type: item.type,
  })
  item.renderSync = true
}
