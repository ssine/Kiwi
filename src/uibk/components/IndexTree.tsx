import React from 'react'
import bus from '../eventBus'
import './IndexTree.css'
import { getEmPixels } from '../Common'

const INDENT_WIDTH = 15

type TreeNode = {
  URI: string
  title: string
  absoluteURI: string
  childs: TreeNode[]
}

type TreeNodeState = {
  expanded: boolean
  childs: {
    [key: string]: TreeNodeState
  }
}

type IndexTreeProperty = {
  rootNode: TreeNode
}

type IndexTreeState = {
  rootNodeState: TreeNodeState
}

class IndexTree extends React.Component<IndexTreeProperty, IndexTreeState> {
  update: () => void

  constructor(props: IndexTreeProperty) {
    super(props)
    this.state = {
      rootNodeState: this._generateInitialState(props.rootNode),
    }
    this.state.rootNodeState.expanded = true
    this.update = () => {
      this.onTreeUpdate()
    }
  }

  componentDidMount() {
    bus.on('item-tree-changed', this.update)
  }

  componentWillUnmount() {
    bus.off('item-tree-changed', this.update)
  }

  _generateInitialState(root: TreeNode): TreeNodeState {
    const childs = {}
    root.childs.forEach(c => {
      childs[c.URI] = this._generateInitialState(c)
      if (c.URI === 'index') {
        root.title = c.title
      }
    })
    return {
      expanded: false,
      childs: childs,
    }
  }

  _assignExpandState(to: TreeNodeState, from: TreeNodeState) {
    to.expanded = from.expanded
    for (const key in from.childs) {
      if (key in to.childs) {
        this._assignExpandState(to.childs[key], from.childs[key])
      }
    }
  }

  onTreeUpdate() {
    const newState = this._generateInitialState(this.props.rootNode)
    this._assignExpandState(newState, this.state.rootNodeState)
    newState.expanded = true
    this.setState({
      rootNodeState: newState,
    })
  }

  _renderTree(node: TreeNode, state: TreeNodeState, level: number): JSX.Element[] {
    let nodeList = []
    const curNode =
      Object.keys(state.childs).length > 0 ? (
        <div
          key={node.absoluteURI}
          className="kiwi-indextree-item"
          style={{ paddingLeft: INDENT_WIDTH * level }}
          onClick={_ => {
            bus.emit('item-link-clicked', {
              targetURI: node.absoluteURI,
            })
          }}
        >
          <div
            className={`kiwi-indextree-foldicon ms-Icon ms-Icon--${state.expanded ? 'ChevronDown' : 'ChevronRight'}`}
            onClick={ev => {
              state.expanded = !state.expanded
              this.forceUpdate()
              ev.stopPropagation()
            }}
          ></div>
          {node.title}
        </div>
      ) : (
        <div
          key={node.absoluteURI}
          className="kiwi-indextree-item"
          style={{ paddingLeft: INDENT_WIDTH * level + getEmPixels() * 1.4 }}
          onClick={_ => {
            bus.emit('item-link-clicked', {
              targetURI: node.absoluteURI,
            })
          }}
        >
          {node.title}
        </div>
      )

    nodeList.push(curNode)
    if (Object.keys(state.childs).length > 0 && state.expanded) {
      nodeList = nodeList.concat(
        Object.keys(state.childs).map((uri, idx) => {
          return this._renderTree(node.childs[idx], state.childs[uri], level + 1)
        })
      )
    }

    return nodeList
  }

  render() {
    return (
      <div className="kiwi-tree-list">
        {this._renderTree(this.props.rootNode, this.state.rootNodeState, -1).slice(1)}
      </div>
    )
  }
}

export { IndexTree }
