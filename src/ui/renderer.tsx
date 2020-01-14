import { client_item as item } from './item'
import * as React from "react"
import * as ReactDOM from "react-dom"
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { ItemComp } from './components/item'

export class Renderer {
  constructor() {
    initializeIcons('/uifabric-icons/')
  }
  render_item(it: item, el: Element) {
    ReactDOM.render(
      <ItemComp item={it} />,
      el
    )
  }
  render_item_editor(it: item, el: Element) {

  }
  render_sidebar(config: Object, el: Element) {

  }
}
