/**
 * URI Mapping
 * 
 * This module implements the logic of constructing URI from a tree of items.
 * The relationship between item and it's URI is a bijection (one-to-one).
 * 
 * We use "uri-name" in item header if present, and fallback to use item titles.
 * If the title contains only number, alphabets and spaces, we convert them to lower-case
 * and replace spaces with slash `-`.
 * If the content type is not renderable markup language, we add an extension to it.
 * Finally we URL encodes the result.
 * 
 * This does not ensure a bijection, but is feasible most of the time. So I plan to provide
 * the ability to costumize URI mapper.
 * 
 * @packageDocumentation
 */

import { ServerItem } from './ServerItem'
import { getLogger } from './Log'
import { renderableMIME } from './Common'

const logger = getLogger('uri')

const isNumAlphaBlankBracket = /^[0-9a-zA-Z ()]*$/.compile()

type URIItemMap = Record<string, ServerItem>

let URIMap: URIItemMap = {}

const normalizeURI = function normalizeURI(ori: string): string {
  ori = ori.replace(/\\+/g, '/')
  ori = ori.replace(/\/+/g, '/')
  return ori
}

const getNewItemURI = function generateURIFromNewItem(item: ServerItem) {
  let uri: string
  if (isNumAlphaBlankBracket.test(item.title)) {
    uri = item.title.toLowerCase().replace(/[ ]/g, '-')
  } else {
    uri = encodeURI(item.title)
  }
  // remove file extension only when the type is renderable
  if (!!item.type && renderableMIME.has(item.type)) return uri
  return `${uri}${item.fnode?.path.ext}`
}

const getItemURI = function generateURIFromItem(item: ServerItem): string {
  if (item.fnode === null) throw `Item doesn't have a corresponding file node!`
  // remove file extension only when the type is renderable
  if (!!item.type && renderableMIME.has(item.type)) return item.fnode.path.name
  else return item.fnode.path.base
}

const URIDFS = function URIDFS(item: ServerItem, prefix: string) {
  const uri = `${prefix}${getItemURI(item)}`
  item.uri = uri
  URIMap[item.uri] = item
  logger.info(`Assign URI [${uri}] to item [${item.title}].`)
  for (const child of item.childs) {
    URIDFS(child, `${uri}/`)
  }
}

/**
 * Genarate an unique uri for each of the items
 * Returns the mapping from uri to item
 */
const generateURI =
function generateURIFromItemTree(rootItem: ServerItem, prefix: string): URIItemMap {
  URIMap = {}
  for (const child of rootItem.childs)
    URIDFS(child, prefix)
  return Object.assign({}, URIMap)
}

export {
  URIItemMap,
  generateURI,
}
