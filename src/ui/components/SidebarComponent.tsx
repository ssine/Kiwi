import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import { IconButton } from './basic/Button/IconButton'
import { Pivot, PivotItem } from './basic/Pivot/Pivot'
import { Banner } from './basic/Banner/Banner'
import { URINode } from '../URIParser'
import { getCookie } from '../common'

import { IndexTree } from './IndexTree'
import SearchBar from './SearchBar'
import ItemFlowVis from './ItemFlowVis'
import LoginForm from './LoginForm'

export type SidebarComponentProperty = {
  title: string
  subTitle: string
  itemFlow: ClientItem[]
  rootNode: URINode
}

type SidebarComponentState = {
}

export class SidebarComponent extends React.Component<SidebarComponentProperty, SidebarComponentState> {
  constructor(props: SidebarComponentProperty) {
    super(props)
  }

  render() {
    return (
      <div className="sidebar" style={{
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 className="site-title" id="site-title">{this.props.title}</h1>
        <div className="site-subtitle" id="site-subtitle">{this.props.subTitle}</div>
        <div className="page-controls">
          {getCookie('token') !== '' ? <>
            <IconButton
              iconName="Add"
              title="New Item"
              onClick={_ => { bus.emit('create-item-clicked', {}) }}
              styles={{ root: { width: 30, height: 30, fontSize: 20 } }}
            />
          </> : <></>}
        </div>
        <SearchBar />
        <Pivot
          styles={{
            panel: { flexGrow: 1, overflow: 'auto', marginTop: 5 },
            root: {
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              flexGrow: 1
            }
          }}>
          <PivotItem name="Open">
            <ItemFlowVis itemFlow={this.props.itemFlow} />
          </PivotItem>
          <PivotItem name="Index">
            <IndexTree rootNode={this.props.rootNode} />
          </PivotItem>
          <PivotItem name="Action">
            <Banner text="Account" />
            <LoginForm />
          </PivotItem>
        </Pivot>
      </div>
    )
  }
}
