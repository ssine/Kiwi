import { pageConfigs } from '../boot/config'
import { ClientItem } from './ClientItem'
import { CSSColorToRGBA, HSVtoRGB, RGBtoCSSColor, RGBtoHSV, setPageColors } from './Common'
import { ItemManager } from './ItemManager'
import { contentPostProcess } from './components/ItemDisplay'
import * as common from './Common'
import * as coreCommon from '../core/Common'

const manager = ItemManager.getInstance()

export const ScriptApi = {
  getItem: async (uri: string) => {
    await manager.ensureItemLoaded(uri)
    return JSON.parse(JSON.stringify(manager.getItem(uri)))
  },
  saveItem: async (uri: string, item: ClientItem, file?: File) => {
    return manager.saveItem(uri, item, file)
  },
  deleteItem: async (uri: string) => {
    return manager.deleteItem(uri)
  },
  createItem: (uri?: string) => {
    const finalUri = manager.createItem(uri)
    return [finalUri, manager.getItem(finalUri)]
  },
  getAllItems: () => {
    return manager.items
  },

  getThemeHue: (): string => {
    return RGBtoHSV(CSSColorToRGBA(manager.getItem(pageConfigs.primaryColor).content.trim())).h
  },
  // hue: [0, 1]
  setThemeHue: (hue: number) => {
    setPageColors(hue)
  },
  // hue: [0, 1]
  saveThemeHue: async (hue: number) => {
    const item = manager.getItem(pageConfigs.primaryColor)
    item.content = RGBtoCSSColor(HSVtoRGB({ h: hue, s: 1, v: 1 }))
    return manager.saveItem(pageConfigs.primaryColor, item)
  },

  tools: Object.assign({}, coreCommon, common),

  postProcess: contentPostProcess,
}
