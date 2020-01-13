/**
 * Management of items
 * @packageDocumentation
 */
import { resolve } from 'path'
import { server_item as item } from './server_item'
import { build_item_tree_from_path } from './file'
import { generate_uri, generate_system_uri } from './uri'
import { uri_item_map } from './uri'
import { assign_target_properties } from './common'

/**
 * Wrapper class of functions when manageing items
 */
export class item_manager {
  map: uri_item_map = {}
  system_path: string = ''
  system_load: boolean = false

  /**
   * Load system and user items with user root path specified.
   * Return a mapping of the two, all system uri starts with $kiwi
   */
  async load_items(root_path: string): Promise<uri_item_map> {
    this.system_path = resolve(__dirname, '../kiwi')
    const user_tree = await build_item_tree_from_path(root_path)
    const sys_tree = await build_item_tree_from_path(this.system_path)
    const user_map = generate_uri(user_tree)
    const sys_map = generate_system_uri(sys_tree)
    for (let key in sys_map)
      user_map[key] = sys_map[key]
    
    this.system_load = true
    this.map = user_map
    return user_map
  }

  get_uri_item_map(): uri_item_map {
    if (!this.system_load) throw 'Items not loaded!'
    return this.map
  }

  get_item(uri: string): item {
    if (!this.map[uri]) {
      let missing = new item()
      missing.uri = uri
      this.map[uri] = missing
    }
    return this.map[uri]
  }

  /**
   * sync an item back to filesystem, create one if not exist
   */
  async put_item(it: item): Promise<item> {
    let _it = this.get_item(it.uri)
    assign_target_properties(_it, it)
    _it.html()
    return _it
  }

  get_items(uris: string[]): item[] {
    return uris.map(u => this.get_item(u))
  }

  get_system_items(): item[] {
    let lst = []
    for (let k in this.map) {
      if (k[0] === '$')
        lst.push(this.map[k])
    }
    return lst
  }

}

export const manager = new item_manager()
