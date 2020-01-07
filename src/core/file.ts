import * as fs from "fs"
import * as path from "path"

/**
 * @classdesc Class representing a file or a folder
 * 
 * used to save changes back or notify file changes from filesystem
 */
export class fs_node {
  path: path.ParsedPath
  absolute_path: string
  type: 'file' | 'directory'
  childs: fs_node[]
  parent: fs_node | null
  constructor(node_path: string, parent: fs_node | null) {
    this.absolute_path = path.resolve(node_path)
    this.path = path.parse(this.absolute_path)
    this.type = fs.lstatSync(this.absolute_path).isFile() ? 'file' : 'directory'
    this.childs = []
    this.parent = parent
  }
  toString(): string {
    return this.absolute_path + '\n' + this.childs.map(v => v.toString()).join('')
  }
}

async function build_file_tree_dfs(node: fs_node) {
  if (node.type === 'file') return
  const childs = await fs.promises.readdir(node.absolute_path)
  for (let child_path of childs) {
    let child = new fs_node(path.join(node.absolute_path, child_path), node)
    await build_file_tree_dfs(child)
    node.childs.push(child)
  }
}

/**
 * @breif build a tree representing the target folder
 */
export async function build_file_tree(root_path: string): Promise<fs_node> {
  let root = new fs_node(root_path, null)
  await build_file_tree_dfs(root)
  return root
}
