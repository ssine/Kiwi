import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import { IconButton } from 'office-ui-fabric-react'
import { Label, ILabelStyles } from 'office-ui-fabric-react/lib/Label'
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import { IStyleSet } from 'office-ui-fabric-react/lib/Styling'

import { URINode } from '../URIParser'
import { getCookie } from '../common'

import IndexTree from './IndexTree'
import SearchBar from './SearchBar'
import ItemFlowVis from './ItemFlowVis'
import LoginDialogButton from './LoginDialogButton'

export type SidebarComponentProperty = {
  title: string
  subTitle: string
  itemFlow: ClientItem[]
  rootNode: URINode
}

type SidebarComponentState = {
}

const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10 }
}

export class SidebarComponent extends React.Component<SidebarComponentProperty, SidebarComponentState> {
  constructor(props: SidebarComponentProperty) {
    super(props)
  }

  render() {
    return (
      <div className="sidebar" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 className="site-title" id="site-title">{this.props.title}</h1>
        <div className="site-subtitle" id="site-subtitle">{this.props.subTitle}</div>
        <div className="page-controls">
          {getCookie('token') !== '' ? <>
          <IconButton iconProps={{ iconName: 'Add' }} title="New Item" ariaLabel="New Item" onClick={evt => {
            bus.emit('create-item-clicked', {})
          }} style={{ color: 'purple' }} className="item-close" />
          </> : <></>}
        </div>
        <SearchBar />
        <Pivot
          styles={{ itemContainer: { flexGrow: 1, overflow: 'auto' } }}
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            flexGrow: 1 
        }}>
          <PivotItem headerText="Open">
            <ItemFlowVis itemFlow={this.props.itemFlow} />
          </PivotItem>
          <PivotItem headerText="Index">
            <Label styles={labelStyles}>
              <IndexTree
                itemTree={this.props.rootNode}
              />
            </Label>
          </PivotItem>
          <PivotItem headerText="Action">
            <Label styles={labelStyles}>
              <LoginDialogButton />
            </Label>
          </PivotItem>
        </Pivot>
      </div>
    )
  }
}
