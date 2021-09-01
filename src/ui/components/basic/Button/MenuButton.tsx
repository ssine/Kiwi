/**
 * A simplt text button with menu
 */
import React from 'react'
import './MenuButton.css'
import { ContextualMenu, ContextualMenuProperty } from '../Menu/ContextualMenu'
import { Callout, AttachDirection } from '../Callout/Callout'

type MenuButtonProperty = {
  name?: string
  iconName?: string
  iconOnly?: boolean
  menuProps: ContextualMenuProperty
  style?: React.CSSProperties
  calloutWarpperStyle?: React.CSSProperties
}

class MenuButton extends React.Component<MenuButtonProperty, { isMenuVisible: boolean }> {
  constructor(props) {
    super(props)
    this.state = {
      isMenuVisible: false,
    }
  }

  render() {
    const style = Object.assign({}, this.props.style)
    return (
      <Callout
        visible={this.state.isMenuVisible}
        direction={AttachDirection.bottomLeftEdge}
        onDismiss={_ => this.setState({ isMenuVisible: false })}
        content={<ContextualMenu {...this.props.menuProps} />}
        wrapperStyle={this.props.calloutWarpperStyle}
      >
        {this.props.iconOnly ? (
          <button
            className="kiwi-menu-button kiwi-icon-button"
            style={style}
            onClick={_ => this.setState({ isMenuVisible: true })}
          >
            {this.props.iconName && <i className={`ms-Icon ms-Icon--${this.props.iconName}`}></i>}
          </button>
        ) : (
          <button className="kiwi-menu-button" style={style} onClick={_ => this.setState({ isMenuVisible: true })}>
            {this.props.iconName && <i className={`ms-Icon ms-Icon--${this.props.iconName}`}></i>}
            {this.props.name}
          </button>
        )}
      </Callout>
    )
  }
}

export { MenuButton }
