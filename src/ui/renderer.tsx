import ClientItem from './ClientItem'
import * as React from "react"
import * as ReactDOM from "react-dom"
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { ItemComponent } from './components/ItemComponent'
import SidebarComponent from './components/SidebarComponent'
import { loadTheme } from 'office-ui-fabric-react/lib/Styling'

export default class Renderer {
  constructor() {
    initializeIcons('/uifabric-icons/')
    loadTheme({
      palette: {
        'neutralPrimary': 'purple',    // Used for button text
        // 'neutralLighter': 'red',       // Used for button background
      }
    });
  }
  render_item(it: ClientItem, el: Element) {
    ReactDOM.render(
      <ItemComponent item={it} />,
      el
    )
  }
  render_item_editor(it: ClientItem, el: Element) {
    
  }
  render_sidebar(config: {title: string, subTitle: string, itemFlow: ClientItem[]}, el: Element) {    
    ReactDOM.render(
      React.createElement(SidebarComponent, config),
      el
    )
  }
}
