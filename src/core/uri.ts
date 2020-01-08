/**
 * URI Mapping
 * 
 * This module implements the logic of constructing URI from a tree of items.
 * The relationship between item and it's URI is a bijection (one-to-one).
 * 
 * We use "uri-name" in item header if present, and fallback to use item titles.
 * If the title contains only number, alphabets and spaces, we convert them to lower-case
 * and replace spaces with slash `-`.
 * Finally we URL encodes the result.
 * 
 * This does not ensure a bijection, but is feasible most of the time. So I plan to provide
 * the ability to costumize URI mapper.
 * 
 * @packageDocumentation
 */

import { item } from './item'

type uri_item_map = {
  [uri: string]: item
}

let uri_map: uri_item_map = {}

function normalize_uri(ori: string): string {
  ori = ori.replace(/\\+/g, '/')
  ori = ori.replace(/\/+/g, '/')
  return ori
}

/**
 * It's late. Let's do this tomorrow.
 */
function uri_dfs(item: item, root_path: string) {
  if (item.fnode.path.dir.startsWith(root_path)) {
    item.uri = '/' + item.fnode.path.dir.substr(root_path.length) + '/' + item.fnode.path.name
  } else {
    item.uri = '/' + item.fnode.path.dir + '/' + item.fnode.path.name
  }
  item.uri = normalize_uri(item.uri)
  uri_map[item.uri] = item
  for (let child of item.childs) {
    uri_dfs(child, root_path)
  }
}

function generate_uri(root_item: item): uri_item_map {
  uri_dfs(root_item, '/')
  return uri_map
}

export {
  uri_item_map,
  generate_uri
}
