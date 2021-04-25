/**
 * Some notes about responsive layout:
 *   On mobile platform, the screen is divided into 8 columns
 *   and so 12.5vw is the unit of item display.
 *   On desktop, the layout is done by px.
 */
import ClientItem from './ClientItem'
import React from 'react'
import ReactDOM from 'react-dom'
import {ItemComponent} from './components/ItemComponent'
import {SidebarComponentProperty, SidebarComponent} from './components/SidebarComponent'
import SidebarSwitch from './components/SidebarSwitch'

export default class Renderer {
  constructor() {}

  renderItem(it: ClientItem, el: Element) {
    ReactDOM.render(<ItemComponent item={it} />, el)
  }

  renderSidebar(config: SidebarComponentProperty, el: Element) {
    ReactDOM.render(React.createElement(SidebarComponent, config), el)
  }

  renderSidebarSwitch(el: HTMLElement) {
    return ReactDOM.render(React.createElement(SidebarSwitch, {container: el}), el)
  }
}
