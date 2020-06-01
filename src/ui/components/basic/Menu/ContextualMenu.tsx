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
          return <div
            className="kiwi-contextual-menu-item"
            onClick={(ev) => {
              item.onClick(item)
              ev.preventDefault()
            }}
            id={item.id}
            key={item.id}>
            {item.iconName && <div className="kiwi-contextual-menu-item-icon"><i className={`ms-Icon ms-Icon--${item.iconName}`} /></div>}
            <div style={this.props.styles?.text} className='kiwi-contextual-menu-item-text'>{item.text}</div>
          </div>
        })}</div>
    )
  }
}

export { ContextualMenu, ContextualMenuItem, ContextualMenuProperty }
