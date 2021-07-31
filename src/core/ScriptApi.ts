import { ItemManager } from './ItemManager'

const manager = ItemManager.getInstance()

export const ScriptApi = {
  getItem: async (uri: string) => {
    return manager.getItem(uri, '', true)
  },
  getAllItems: async () => {
    return manager.getAllItems('', true)
  },
}
