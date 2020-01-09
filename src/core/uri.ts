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

import { item } from './item_base'
import { get_logger } from './log'
import { editable_content_type, content_type_to_ext } from './common'

const logger = get_logger('uri')

const is_num_alpha_blank = /^[0-9a-zA-Z ]*$/.compile()

type uri_item_map = {
  [uri: string]: item
}

let uri_map: uri_item_map = {}

function normalize_uri(ori: string): string {
  ori = ori.replace(/\\+/g, '/')
  ori = ori.replace(/\/+/g, '/')
  return ori
}

function item_to_uri(it: item) {
  let uri: string
  if (is_num_alpha_blank.test(it.title)) {
    uri = it.title.toLowerCase().replace(/[ ]/g, '-')
  } else {
    uri = encodeURI(it.title)
  }
  if (!it.type || editable_content_type.has(it.type)) return uri
  return `${uri}.${content_type_to_ext(it.type)}`
}

function uri_dfs(item: item, prefix: string) {
  let uri = `${prefix}${item_to_uri(item)}`
  logger.info(`assigning uri ${uri} to item ${item.title}`)
  item.uri = uri
  uri_map[item.uri] = item
  for (let child of item.childs) {
    uri_dfs(child, `${uri}/`)
  }
}

/**
 * Genarate an unique uri for each of the items
 * Returns the mapping from uri to item
 */
function generate_uri(root_item: item): uri_item_map {
  for (let child of root_item.childs)
    uri_dfs(child, '')
  return uri_map
}

export {
  uri_item_map,
  generate_uri
}
