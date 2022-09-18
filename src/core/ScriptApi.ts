import { ItemManager } from './ItemManager'

export const ScriptApi = {
  getItem: async (uri: string) => {
    return ItemManager.getItem(uri, '', true)
  },
  getAllItems: async () => {
    return ItemManager.getAllItems('', true)
  },
}
