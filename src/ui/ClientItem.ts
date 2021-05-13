import { BaseItem } from '../core/BaseItem'

export interface ClientItem extends BaseItem {
  skinny: boolean
  /**
   * is this item newly created?
   * if new === true, the item was initialy displaied in edit mode,
   * and is discarded if edit was canceled
   */
  new?: boolean
}
