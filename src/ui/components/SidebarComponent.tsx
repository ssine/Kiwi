import bus from '../eventBus'
import ClientItem from '../ClientItem'
import * as React from 'react'
import { IconButton, Callout } from 'office-ui-fabric-react'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Label, ILabelStyles } from 'office-ui-fabric-react/lib/Label'
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot'
import { IStyleSet } from 'office-ui-fabric-react/lib/Styling'
import { List } from 'office-ui-fabric-react/lib/List'
import { mergeStyleSets } from 'office-ui-fabric-react/lib/Styling'
import { GroupedList, IGroup } from 'office-ui-fabric-react/lib/GroupedList'
import { IColumn, DetailsRow } from 'office-ui-fabric-react/lib/DetailsList'
import { Selection, SelectionMode } from 'office-ui-fabric-react/lib/Selection'
import { URINode } from '../URIParser'

const ROW_HEIGHT = 26
const FONT_SIZE = 13

type IndexTreeProperty = {
  itemTree: URINode
}

class IndexTree extends React.Component<IndexTreeProperty, {}> {
  private items: URINode[]
  private columns: IColumn[]
  private groups: IGroup[]
  private selection: Selection
  update: any

  constructor(props: IndexTreeProperty) {
    super(props)

    const [it, gp] = this.convertURIToGroupedList(this.props.itemTree)

    this.items = it
    this.groups = [gp]

    this.columns = [{
      key: 'URI',
      name: 'URI',
      fieldName: 'URI',
      minWidth: 200
    }]

    this.selection = new Selection()
    this.update = () => { this.forceUpdate() }
  }
  
  componentDidMount() {
    bus.on('item-tree-changed', this.update)
  }
  componentWillUnmount() {
    bus.off('item-tree-changed', this.update)
  }

  UNSAFE_componentWillUpdate() {
    const [it, gp] = this.convertURIToGroupedList(this.props.itemTree)

    this.items = it
    this.groups = [gp]
  }

  public render(): JSX.Element {
    return (
      <div>
        <input type="checkbox" hidden></input>
        <GroupedList
          items={this.items}
          onRenderCell={this._onRenderCell}
          selectionMode={SelectionMode.none}
          groups={this.groups}
          compact={true}
          groupProps={{
            headerProps: {
              indentWidth: ROW_HEIGHT / 2,
              styles: { 
                root: { border: 0 },
                groupHeaderContainer: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, fontSize: FONT_SIZE },
                expand: {height: ROW_HEIGHT, width: ROW_HEIGHT, fontSize: FONT_SIZE }, // the arrow icon button
                title: {paddingLeft: 3, fontSize: FONT_SIZE },
              }
            }
          }}
        />
      </div>
    )
  }

  private _onRenderCell = (nestingDepth: number, item: { uri: string, title: string }, itemIndex: number): JSX.Element => {
    return (
      <div onClick={(_) => {
        bus.emit('item-link-clicked', {
          // @ts-ignore
          targetURI: item.absoluteURI
        })
        console.log('! click event triggered on ', _)
      }}>
        
      <DetailsRow
        columns={this.columns}
        groupNestingDepth={nestingDepth}
        item={item}
        itemIndex={itemIndex}
        selection={this.selection}
        selectionMode={SelectionMode.none}
        indentWidth={ROW_HEIGHT / 2}
        eventsToRegister={[{
          eventName: 'click',
          callback: (item, index, event) => {
            console.log('! click event triggered on ', item, index, event)
          }
        }]}
        styles={{
          root: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, width: '100%', background: '#f5f3fc' },
        }}
        compact={true}
        />
        </div>
    )
  }

  private convertURIToGroupedList(root: URINode): [URINode[], IGroup] {
    const items = []

    const dfs = (node: URINode, level: number): (IGroup | null) => {
      if (node.childs.length === 0) {
        items.push(node)
        return null
      }
      
      const gp: IGroup = {
        count: 0,
        key: node.URI,
        name: node.title,
        startIndex: items.length,
        level: level,
        children: [],
        isCollapsed: true
      }

      let hasItem = false
      let hasGroup = false
      let childItems = []

      for (const nd of node.childs) {
        const cgp = dfs(nd, level + 1)
        if (cgp !== null ) {
          hasGroup = true
          gp.children.push(cgp)
          gp.count += cgp.count
        } else {
          hasItem = true
          childItems.push(items.pop())
          gp.count += 1
        }
      }

      if (hasItem) {
        if (hasGroup) {
          const idxGroup: IGroup = {
            count: childItems.length,
            key: 'index',
            name: 'Index',
            startIndex: items.length,
            level: level + 1,
            children: [],
            isCollapsed: false,
          }
          gp.children.push(idxGroup)
        }
        items.push(...childItems)
      }

      return gp
    }

    const gp = dfs(root, 0)
    gp.isCollapsed = false

    return [items, gp]
  }

}

type SearchBarProperty = {

}

type SearchBarState = {
  isSearching: boolean
  searchResults: ClientItem[]
}

const getSearchResult = async function getSearchResult(input: string): Promise<ClientItem[]> {
  const token = Math.random().toString().slice(2)
  bus.emit('search-triggered', { input: input, token: token })
  return new Promise<ClientItem[]>((res, rej) => {
    bus.once(`search-result-${token}`, (data: {items: ClientItem[]}) => {
      res(data.items)
    })
  })
}

class SearchBar extends React.Component<SearchBarProperty, SearchBarState> {
  searchBoxRef: React.RefObject<HTMLDivElement>
  searchCount: number
  searchResultStamp: number

  constructor(props: SearchBarProperty) {
    super(props)
    this.searchBoxRef = React.createRef()
    this.searchCount = 0
    this.searchResultStamp = 0
    this.state = {
      isSearching: false,
      searchResults: []
    }
  }
  render() {
    return <>
      <div ref={this.searchBoxRef}>
      <SearchBox
        placeholder="search..."
        onChange={async (_, newValue) => {
          if (newValue === '') this.setState({isSearching: false})
          else this.setState({isSearching: true})
          this.searchCount += 1
          const stamp = this.searchCount
          const results = await getSearchResult(newValue)
          if (stamp > this.searchResultStamp) {
            this.setState({searchResults: results})
            this.searchResultStamp = stamp
          }
        }}
      />
      </div>
      {this.state.isSearching && (
        <Callout isBeakVisible={false} target={this.searchBoxRef} calloutWidth={this.searchBoxRef.current.clientWidth}>
          <List items={this.state.searchResults} onRenderCell={this._onRenderCell} />
          {this.state.searchResults.length} results found ...
        </Callout>
      )}
  </> 
  }

  private _onRenderCell(item: ClientItem, index: number, isScrolling: boolean): JSX.Element {
    return (
      <div data-is-focusable={true} 
      className={mergeStyleSets({
        listItem: [{
          margin: 0,
          paddingTop: 3,
          paddingLeft: 10,
          paddingBottom: 5,
          cursor: 'pointer',
          selectors: {
            '&:hover': { background: '#d5cfe7' }
          }
        }]
      }).listItem}
      onClick={_ => bus.emit('item-link-clicked', {targetURI: item.uri})}
      >
      {item.uri}
    </div>
    )
  }
}


type ItemFlowVisProperty = {
  itemFlow: ClientItem[]
}

class ItemFlowVis extends React.Component<ItemFlowVisProperty, {}> {
  update: any

  constructor(props: ItemFlowVisProperty) {
    super(props)
    this.update = () => { this.forceUpdate() }
  }
  componentDidMount() {
    bus.on('item-displaied', this.update)
    bus.on('item-closed', this.update)
  }
  
  componentWillUnmount() {
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
        height: '100%',
      }}>
        <h1 className="site-title">{this.props.title}</h1>
        <div className="site-subtitle">{this.props.subTitle}</div>
        <div className="page-controls">
          <IconButton iconProps={{ iconName: 'Add' }} title="New Item" ariaLabel="New Item" onClick={evt => {
            bus.emit('create-item-clicked', {})
          }} style={{ color: 'purple' }} className="item-close" />
        </div>
        <SearchBar />
        <Pivot aria-label="Status" style={{marginTop: 10}}>
          <PivotItem
            headerText="Opened"
            headerButtonProps={{
              'data-order': 1,
              'data-title': 'My Files Title'
            }}
          >
          <ItemFlowVis itemFlow={this.props.itemFlow} />
          </PivotItem>
          <PivotItem headerText="Index">
            <Label styles={labelStyles}>
            <IndexTree 
              itemTree={this.props.rootNode}
            />
            </Label>
          </PivotItem>
          <PivotItem headerText="More">
            <Label styles={labelStyles}>Pivot #3</Label>
          </PivotItem>
        </Pivot>
      </div>
    )
  }



}
