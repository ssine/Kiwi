import React from 'react'
import './IconButton.css'

type IconButtonProperty = {
  iconName: string
  title?: string
  text?: string
  disabled?: boolean
  styles?: {
    root?: React.CSSProperties
    icon?: React.CSSProperties
  }
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  divRef?: React.Ref<HTMLButtonElement>
}

class IconButton extends React.Component<IconButtonProperty, {}> {
  render() {
    return this.props.disabled ? (
      <button
        className="kiwi-icon-button disabled"
        title={this.props.title}
        ref={this.props.divRef}
        style={this.props.styles?.root}
      >
        <i style={this.props.styles?.icon} className={`ms-Icon ms-Icon--${this.props.iconName}`} />
      </button>
    ) : (
      <button
        className="kiwi-icon-button"
        title={this.props.title}
        ref={this.props.divRef}
        style={this.props.styles?.root}
        onClick={this.props.onClick}
      >
        {this.props.text}
        <i style={this.props.styles?.icon} className={`ms-Icon ms-Icon--${this.props.iconName}`} />
      </button>
    )
  }
}

export {IconButton}
