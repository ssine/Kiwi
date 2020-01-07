import { item } from './item'

export type uri_item_map = {
  [uri: string]: item
}

let uri_map: uri_item_map = {}

function normalize_uri(ori: string): string {
  ori = ori.replace(/\\+/g, '/')
  ori = ori.replace(/\/+/g, '/')
  return ori
}

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

export function generate_uri(root_item: item): uri_item_map {
  let root_path = root_item.fnode.absolute_path
  uri_dfs(root_item, root_path)
  return uri_map
}
