import React from 'react'
import bus from '../eventBus'
import { GroupedList, IGroup } from 'office-ui-fabric-react/lib/GroupedList'
import { IColumn, DetailsRow } from 'office-ui-fabric-react/lib/DetailsList'
import { Selection, SelectionMode } from 'office-ui-fabric-react/lib/Selection'
import { URINode } from '../URIParser'

const ROW_HEIGHT = 26
const FONT_SIZE = 13

type IndexTreeProperty = {
  itemTree: URINode
}

type IndexTreeState = {
  items: URINode[]
  group: GroupWithURI
}

type GroupWithURI = IGroup & { absoluteURI: string }

export default class IndexTree extends React.Component<IndexTreeProperty, IndexTreeState> {
  private columns: IColumn[]
  private selection: Selection
  update: any

  constructor(props: IndexTreeProperty) {
    super(props)

    const [it, gp] = this.convertURIToGroupedList(this.props.itemTree)

    this.state = {
      items: it,
      group: gp
    }

    this.columns = [{
      key: 'title',
      name: 'title',
      fieldName: 'title',
      minWidth: 200
    }]

    this.selection = new Selection()
    this.update = () => { this.onTreeUpdate() }
  }
  
  componentDidMount() {
    bus.on('item-tree-changed', this.update)
  }
  componentWillUnmount() {
    bus.off('item-tree-changed', this.update)
  }

  onTreeUpdate() {
    const [newIt, newGp] = this.convertURIToGroupedList(this.props.itemTree)
    let oldGp = this.state.group
    this.collapseStateAssign(oldGp, newGp)
    this.setState({
      items: newIt,
      group: newGp
    })
  }

  collapseStateAssign(from: GroupWithURI, to: GroupWithURI) {
    to.isCollapsed = from.isCollapsed
    for (const fc of from.children as GroupWithURI[]) {
      for (const tc of to.children as GroupWithURI[]) {
        if (fc.absoluteURI === tc.absoluteURI) {
          this.collapseStateAssign(fc, tc)
          break
        }
      }
    }
  }

  public render(): JSX.Element {
    return (
      <div>
        <input type="checkbox" hidden></input>
        <GroupedList
          items={this.state.items}
          onRenderCell={this._onRenderCell}
          selectionMode={SelectionMode.none}
          groups={this.state.group.children}
          compact={true}
          groupProps={{
            headerProps: {
              indentWidth: ROW_HEIGHT / 2,
              styles: { 
                root: { border: 0 },
                groupHeaderContainer: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, fontSize: FONT_SIZE },
                expand: {height: ROW_HEIGHT, width: ROW_HEIGHT, fontSize: FONT_SIZE }, // the arrow icon button
                title: {paddingLeft: 3, fontSize: FONT_SIZE },
              },
              onGroupHeaderClick: (group) => {
                bus.emit('item-link-clicked', {
                  // @ts-ignore
                  targetURI: group.absoluteURI
                })
              }
            }
          }}
        />
      </div>
    )
  }

  private _onRenderCell = (nestingDepth: number, item: URINode, itemIndex: number): JSX.Element => {
    return (
      <div onClick={() => {
        bus.emit('item-link-clicked', {
          // @ts-ignore
          targetURI: item.absoluteURI
        })
      }}>
        
      <DetailsRow
        columns={this.columns}
        groupNestingDepth={item.level}
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

  private convertURIToGroupedList(root: URINode): [URINode[], GroupWithURI] {
    const items: URINode[] = []

    const dfs = (node: URINode, level: number): (GroupWithURI | null) => {
      if (node.childs.length === 0) {
        node.level = level
        items.push(node)
        return null
      }
      
      const gp: GroupWithURI = {
        count: 0,
        key: node.URI,
        name: node.title,
        absoluteURI: node.absoluteURI,
        startIndex: items.length,
        level: level,
        children: [],
        isCollapsed: true
      }

      let hasItem = false
      let hasGroup = false
      let childItems: URINode[] = []

      for (const nd of node.childs) {
        const cgp = dfs(nd, level + 1)
        if (cgp !== null) {
          hasGroup = true
          gp.children.push(cgp)
          gp.count += cgp.count
        } else {
          hasItem = true
          const cit = items.pop()
          childItems.push(cit)
          if (cit.URI === 'index')
            gp.name = cit.title
          gp.count += 1
        }
      }

      if (hasItem) {
        if (hasGroup) {
          const idxGroup: GroupWithURI = {
            count: childItems.length,
            key: 'index',
            name: 'Index',
            absoluteURI: node.absoluteURI,
            startIndex: items.length,
            level: level + 1,
            children: [],
            isCollapsed: false,
          }
          gp.children.push(idxGroup)
          childItems.forEach(nd => nd.level += 1)
        }
        items.push(...childItems)
      }

      return gp
    }

    const gp = dfs(root, -1)
    gp.isCollapsed = false

    return [items, gp]
  }

}