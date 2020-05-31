/**
 * A simplt text button with menu
 */
import React from 'react'
import './MenuButton.css'
import { ContextualMenu, ContextualMenuProperty } from '../Menu/ContextualMenu'
import { Callout, AttachDirection } from '../Callout/Callout'

type MenuButtonProperty = {
  name: string
  key: string
  menuProps: ContextualMenuProperty
  style?: React.CSSProperties
}

class MenuButton extends React.Component<MenuButtonProperty, { isMenuVisible: boolean }> {
  buttonRef: React.RefObject<HTMLDivElement>

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
      <div
        className="kiwi-menu-button"
        ref={this.buttonRef}
        style={style}
        key={this.props.key}
        onClick={_ => this.setState({ isMenuVisible: true })} >
        {this.props.name}
      </div>
      {this.state.isMenuVisible &&
        <Callout
          target={this.buttonRef}
          direction={AttachDirection.bottomLeftEdge}
          width={80}
          onDismiss={_ => this.setState({ isMenuVisible: false })}
          style={{ width: 'auto' }}
        >
          <ContextualMenu {...this.props.menuProps} />
        </Callout>
      }</>
  }
}

export { MenuButton }
