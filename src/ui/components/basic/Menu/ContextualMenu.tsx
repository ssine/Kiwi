import React from 'react'
import './ContextualMenu.css'

type ContextualMenuItem = {
  id: string;
  text: string;
  iconName?: string;
  onClick: (it: ContextualMenuItem) => void;
}

type ContextualMenuProperty = {
  items?: ContextualMenuItem[]
  styles?: {
    root?: React.CSSProperties
    text?: React.CSSProperties
    button?: React.CSSProperties
  }
}

class ContextualMenu extends React.Component<ContextualMenuProperty, {}> {
  render() {
    if (!this.props.items) return <></>
    let style = Object.assign({}, this.props.styles?.root)
    return (
      <div
        className="kiwi-contextual-menu"
        style={style}>{this.props.items.map(item => {
          return <button
            className="kiwi-contextual-menu-item"
            style={this.props.styles?.button}
            onClick={(ev) => {
              item.onClick(item)
            }}
            id={item.id}
            key={item.id}>
            {item.iconName && <div className="kiwi-contextual-menu-item-icon"><i className={`ms-Icon ms-Icon--${item.iconName}`} /></div>}
            <div style={this.props.styles?.text} className='kiwi-contextual-menu-item-text'>{item.text}</div>
          </button>
        })}</div>
    )
  }
}

export { ContextualMenu, ContextualMenuItem, ContextualMenuProperty }
