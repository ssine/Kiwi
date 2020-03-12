import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import { List } from 'office-ui-fabric-react/lib/List'
import { mergeStyleSets } from 'office-ui-fabric-react/lib/Styling'
import { Label, ILabelStyles } from 'office-ui-fabric-react/lib/Label'
import { IStyleSet } from 'office-ui-fabric-react/lib/Styling'

const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10 }
}

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
    return <>
      <Label styles={labelStyles}>
        <List items={this.props.itemFlow.map(it => it.uri)} onRenderCell={this._onRenderCell} />
      </Label>
    </>
  }

  private _onRenderCell(item: string, index: number, isScrolling: boolean): JSX.Element {
    return (
      <div data-is-focusable={true} 
      className={mergeStyleSets({
        listItem: [{
          margin: 0,
          paddingTop: 3,
          paddingLeft: 10,
          paddingBottom: 5,
          selectors: {
            '&:hover': { background: '#d5cfe7' }
          }
        }]
      }).listItem}
      onClick={_ => bus.emit('item-link-clicked', {targetURI: item})}
      >
      {item}
    </div>
    )
  }
}
