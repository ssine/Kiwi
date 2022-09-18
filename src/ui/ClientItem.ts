import { BaseItem } from '../core/BaseItem'

export type ClientItemStatus = 'bare' | 'loading' | 'saving' | 'full' | 'creating'

export interface ClientItem extends BaseItem {
  state: ClientItemStatus
  /**
   * is this item newly created?
   * if new === true, the item was initialy displaied in edit mode,
   * and is discarded if edit was canceled
   */
  new?: boolean
  renderSync: boolean
  renderedHTML: string
}
