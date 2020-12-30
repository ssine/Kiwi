/**
 * A simplt text button with menu
 */
import React from 'react'
import './MenuButton.css'
import { ContextualMenu, ContextualMenuProperty } from '../Menu/ContextualMenu'
import { Callout, AttachDirection } from '../Callout/Callout'

type MenuButtonProperty = {
  name: string
  iconName?: string
  iconOnly?: boolean
  menuProps: ContextualMenuProperty
  style?: React.CSSProperties
}

class MenuButton extends React.Component<MenuButtonProperty, { isMenuVisible: boolean }> {
  buttonRef: React.RefObject<HTMLButtonElement>

  constructor(props) {
    super(props)
    this.buttonRef = React.createRef()
    this.state = {
      isMenuVisible: false
    }
  }

  render() {
    let style = Object.assign({}, this.props.style)
    return <>
      {this.props.iconOnly ? <button
        className="kiwi-menu-button"
        ref={this.buttonRef}
        style={style}
        onClick={_ => this.setState({ isMenuVisible: true })} >
        {this.props.iconName && <i className={`ms-Icon ms-Icon--${this.props.iconName}`}></i>}
      </button> : <button
        className="kiwi-menu-button"
        ref={this.buttonRef}
        style={style}
        onClick={_ => this.setState({ isMenuVisible: true })} >
          {this.props.iconName && <i className={`ms-Icon ms-Icon--${this.props.iconName}`}></i>}
          {this.props.name}
        </button>}
      {this.state.isMenuVisible &&
        <Callout
          target={this.buttonRef}
          direction={AttachDirection.bottomLeftEdge}
          onDismiss={_ => this.setState({ isMenuVisible: false })}
        >
          <ContextualMenu {...this.props.menuProps} />
        </Callout>
      }</>
  }
}

export { MenuButton }
