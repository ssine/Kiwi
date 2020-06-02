import React from 'react'
import './PrimaryButton.css'

type PrimaryButtonProperty = {
  title?: string
  style?: React.CSSProperties
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

class PrimaryButton extends React.Component<PrimaryButtonProperty, {}> {
  render() {
    let style = Object.assign({}, this.props.style)
    return <button
      className="kiwi-primary-button"
      title={this.props.title}
      style={style}
      onClick={this.props.onClick} >
      {this.props.title}
    </button>
  }
}

export { PrimaryButton }
