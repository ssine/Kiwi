import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'

type ItemFlowVisProperty = {
  itemFlow: ClientItem[]
}

export default class ItemFlowVis extends React.Component<ItemFlowVisProperty, {}> {
  update: any

  constructor(props: ItemFlowVisProperty) {
    super(props)
    this.update = () => { this.forceUpdate() }
  }

  componentDidMount() {
    bus.on('item-saved', this.update)
    bus.on('item-displaied', this.update)
    bus.on('item-closed', this.update)
  }

  componentWillUnmount() {
    bus.off('item-saved', this.update)
    bus.off('item-displaied', this.update)
    bus.off('item-closed', this.update)
  }

  render() {
    return <div>{this.props.itemFlow.map(it =>
      <div className="kiwi-active-list-item"
        key={it.uri}
        onClick={_ => bus.emit('item-link-clicked', { targetURI: it.uri })}>
        {it.title}
      </div>
    )}</div>
  }
}
