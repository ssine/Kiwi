import React from 'react'
import './IconButton.css'

type IconButtonProperty = {
  iconName: string
  title?: string
  disabled?: boolean
  style?: React.CSSProperties
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  divRef?: React.Ref<HTMLDivElement>
}

class IconButton extends React.Component<IconButtonProperty, {}> {
  render() {
    let style = Object.assign({}, this.props.style)
    return (this.props.disabled ?
      <div
        className="kiwi-icon-button disabled"
        title={this.props.title}
        ref={this.props.divRef}
        style={style} >
        <i className={`ms-Icon ms-Icon--${this.props.iconName}`} />
      </div>
      :
      <div
        className="kiwi-icon-button"
        title={this.props.title}
        ref={this.props.divRef}
        style={style}
        onClick={this.props.onClick} >
        <i className={`ms-Icon ms-Icon--${this.props.iconName}`} />
      </div>
    )
  }
}

export { IconButton }
