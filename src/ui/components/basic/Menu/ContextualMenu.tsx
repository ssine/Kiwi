import React from 'react'
import './ContextualMenu.css'

type ContextualMenuItem = {
  key: string;
  text: string;
  iconName: string;
  onClick: (ev?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;
}

type ContextualMenuProperty = {
  items: ContextualMenuItem[]
  style?: React.CSSProperties
}

class ContextualMenu extends React.Component<ContextualMenuProperty, {}> {
  render() {
    let style = Object.assign({}, this.props.style)
    console.log(this.props.items)
    return (
      <div
        className="kiwi-contextual-menu"
        style={style}>{this.props.items.map(item => {
          return <div
            className="kiwi-contextual-menu-item"
            onClick={(ev) => {
              item.onClick(ev)
              ev.preventDefault()
            }}
            id={item.key}>
            <div className="kiwi-contextual-menu-item-icon"><i className={`ms-Icon ms-Icon--${item.iconName}`} /></div>
            <div className='kiwi-contextual-menu-item-text'>{item.text}</div>
          </div>
        })}</div>
    )
  }
}

export { ContextualMenu }
