import ClientItem from './ClientItem'
import * as React from "react"
import * as ReactDOM from "react-dom"
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { ItemComponent } from './components/ItemComponent'
import { SidebarComponentProperty, SidebarComponent } from './components/SidebarComponent'
import { loadTheme } from 'office-ui-fabric-react/lib/Styling'

export default class Renderer {
  constructor() {
    initializeIcons('/uifabric-icons/')
    loadTheme({
      palette: {
        neutralPrimary: '#7e489d', // texts
        neutralLighter: '#c8bfe7', // button hover background
        neutralLight: '#b6acd0', // button press background
        themePrimary: '#7e489d',
        themeLighterAlt: '#f9f6fb',
        themeLighter: '#e8dbef',
        themeLight: '#d5bde2',
        themeTertiary: '#ad85c5',
        themeSecondary: '#8c59aa',
        themeDarkAlt: '#72418e',
        themeDark: '#603778',
        themeDarker: '#472959',
        neutralLighterAlt: '#7e489d',
        neutralQuaternaryAlt: '#e1dfdd',
        neutralQuaternary: '#d0d0d0',
        neutralTertiaryAlt: '#c8c6c4',
        neutralTertiary: '#a19f9d',
        neutralSecondary: '#605e5c',
        neutralPrimaryAlt: '#3b3a39',
        neutralDark: '#201f1e',
        black: '#000000',
        white: '#ffffff',
      }
    });
  }

  renderItem(it: ClientItem, el: Element) {
    ReactDOM.render(
      <ItemComponent item={it} />,
      el
    )
  }

  renderSidebar(config: SidebarComponentProperty, el: Element) {    
    ReactDOM.render(
      React.createElement(SidebarComponent, config),
      el
    )
  }
}
