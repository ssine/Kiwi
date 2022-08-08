import { ClientItem } from './ClientItem'
import * as common from './Common'
import * as coreCommon from '../core/Common'
import { createItem, deleteItem, getItem, loadItem, saveItem } from './features/global/item'
import { store } from './store'
import { contentPostProcess } from './features/itemCard/ItemDisplay'

export const ScriptApi = {
  getItem: async (uri: string) => {
    await loadItem(uri)
    return JSON.parse(JSON.stringify(getItem(uri)))
  },
  getItemUnsafe: (uri: string) => {
    const item = getItem(uri)
    return item && JSON.parse(JSON.stringify(item))
  },
  saveItem: async (uri: string, item: ClientItem, file?: File) => {
    return saveItem({ uri, item, file })
  },
  deleteItem: async (uri: string) => {
    return deleteItem(uri)
  },
  createItem: async (uri?: string) => {
    const finalUri = await createItem(uri)
    return [finalUri, getItem(finalUri)]
  },
  getAllItems: () => {
    const state = store.getState()
    return state.items
  },

  tools: Object.assign({}, coreCommon, common),

  postProcess: contentPostProcess,
}
