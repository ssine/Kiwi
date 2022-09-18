import { runInAction } from 'mobx'
import { isContentType } from './MimeType'
import { parse } from './Parser'
import { ItemContext, processRenderPlugin } from './plugin'
import { ServerItem } from './ServerItem'
import { state } from './state'

const defaultContent = `{{list(all => all.filter(i => i[0].startsWith(kiwi.uri) && (i[0].slice(kiwi.uri.length).match(/\\//g) || []).length === 1))}}`

export const renderItem = async (uri: string, item: ServerItem): Promise<string> => {
  if (state.renderCache[uri]) return state.renderCache[uri]
  const content = item.content || ''
  const input =
    content.trim().length === 0 && !item.header.noPlaceholderList && isContentType(item.type) ? defaultContent : content
  const result = parse({
    input: await processRenderPlugin(uri, input, new ItemContext(uri)),
    uri: uri,
    type: item.type,
  })
  runInAction(() => {
    state.renderCache[uri] = result
  })
  return result
}
