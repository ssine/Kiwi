/**
 * Some notes about responsive layout:
 *   On mobile platform, the screen is divided into 8 columns
 *   and so 12.5vw is the unit of item display.
 *   On desktop, the layout is done by px.
 */
import ClientItem from './ClientItem'
import React from "react"
import ReactDOM from "react-dom"
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons'
import { ItemComponent } from './components/ItemComponent'
import { SidebarComponentProperty, SidebarComponent } from './components/SidebarComponent'
import { loadTheme } from 'office-ui-fabric-react/lib/Styling'
import SidebarSwitch from './components/SidebarSwitch'

export default class Renderer {
  constructor() {
    initializeIcons('/uifabric-icons/')
    loadTheme({
      palette: {
        neutralPrimary: 'var(--lineColor)', // texts
        neutralLighter: 'var(--blockColorLighter)', // button hover background
        neutralLight: 'var(--blockColor)', // button press background
        themePrimary: 'var(--lineColor)',
        themeLighterAlt: '#f9f6fb',
        themeLighter: '#e8dbef',
        themeLight: '#d5bde2',
        themeTertiary: '#ad85c5',
        themeSecondary: '#8c59aa',
        themeDarkAlt: 'var(--lineColor)',
        themeDark: 'var(--lineColor)',
        themeDarker: '#472959',
        neutralLighterAlt: 'var(--lineColor)',
        neutralQuaternaryAlt: 'var(--blockColor)', // tree button pressed color
        neutralQuaternary: '#d0d0d0',
        neutralTertiaryAlt: '#c8c6c4',
        neutralTertiary: '#a19f9d',
        neutralSecondary: '#605e5c',
        neutralPrimaryAlt: '#3b3a39',
        neutralDark: 'var(--lineColor)',
        black: '#000000',
        white: '#ffffff',
      }
    });
  }

  renderItem(it: ClientItem, el: Element ) {
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

  renderSidebarSwitch(el: HTMLElement) {    
    return ReactDOM.render(
      React.createElement(SidebarSwitch, { container: el }),
      el
    )
  }
}
