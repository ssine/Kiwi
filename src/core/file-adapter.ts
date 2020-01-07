import * as fs from "fs"
import * as path from "path"

/**
 * \breif Class representing a file or a folder
 */
class FSNode {
  path: path.ParsedPath
  absolute_path: string
  type: 'file' | 'directory'
  childs: FSNode[]
  parent: FSNode | null
  constructor(node_path: string, parent: FSNode | null) {
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

async function build_file_tree_dfs(node: FSNode) {
  if (node.type === 'file') return
  const childs = await fs.promises.readdir(node.absolute_path)
  for (let child_path of childs) {
    let child = new FSNode(path.join(node.absolute_path, child_path), node)
    await build_file_tree_dfs(child)
    node.childs.push(child)
  }
}

export async function build_file_tree(root_path: string): Promise<FSNode> {
  let root = new FSNode(root_path, null)
  await build_file_tree_dfs(root)
  return root
}
