import React from 'react'
import './Pivot.css'

const PivotItem: React.FC<{ name: string }> = props => {
  return <div>{props.children}</div>
}

type PivotProperty = {
  styles?: {
    root?: React.CSSProperties
    panel?: React.CSSProperties
  }
}

type PivotState = {
  activeTab: number
}

class Pivot extends React.Component<PivotProperty, PivotState> {
  constructor(props: PivotProperty) {
    super(props)
    this.state = {
      activeTab: 0,
    }
  }

  render() {
    const tabNames = []
    const tabPanels = []
    React.Children.forEach(this.props.children, (child, idx) => {
      tabNames.push((child as React.ReactElement<{ name: string }>).props.name)
      tabPanels.push((child as React.ReactElement<{ children: any[] }>).props.children)
    })
    return (
      <div className="kiwi-pivot" style={this.props.styles?.root}>
        <div className="kiwi-pivot-tabname">
          {tabNames.map((name, idx) => (
            <button
              key={name}
              className={`kiwi-pivot-button${idx === this.state.activeTab ? ' active' : ''}`}
              style={{ display: 'flex', flexDirection: 'column' }}
              onClick={_ => {
                this.setState({ activeTab: idx })
              }}
            >
              <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>{name}</div>
            </button>
          ))}
        </div>
        <div className="kiwi-pivot-tabpanel" style={this.props.styles?.panel}>
          {tabPanels[this.state.activeTab]}
        </div>
      </div>
    )
  }
}

export { Pivot, PivotItem }
