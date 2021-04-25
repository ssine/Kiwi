import React from 'react'
import {sleep} from '../../../../core/Common'
import {MenuButton} from '../Button/MenuButton'
import './Breadcrumb.css'

type BreadcrumbProperty = {
  // ancestor element to detect weather an overflow has happened
  box: React.RefObject<HTMLElement>
  items: string[]
  onItemClick?: (it: BreadcrumbItem) => void
  style?: React.CSSProperties
}

type BreadcrumbItem = {
  name: string
  uri: string
}

type BreadcrumbState = {
  items: BreadcrumbItem[]
  fold:
    | false
    | {
        start: number
        end: number
      }
}

class Breadcrumb extends React.Component<BreadcrumbProperty, BreadcrumbState> {
  constructor(props: BreadcrumbProperty) {
    super(props)
    const items: BreadcrumbItem[] = []
    let uri = ''
    for (const name of props.items) {
      uri = `${uri}/${name}`
      items.push({
        name: name,
        uri: uri,
      })
    }
    this.state = {
      items: items,
      fold: false,
    }
  }

  async boxReady() {
    while (!this.props.box.current) {
      await sleep(1)
    }
  }

  async checkAndCollapse() {
    await this.boxReady()
    const boxEl = this.props.box.current
    if (boxEl.scrollWidth > boxEl.offsetWidth) {
      if (!this.state.fold) this.setState({fold: {start: 0, end: 0}})
      if (this.state.fold) {
        if (this.state.fold.end >= this.state.items.length) return
        this.setState({fold: {start: 0, end: this.state.fold.end + 1}})
      }
    }
  }

  componentDidMount() {
    this.checkAndCollapse()
  }

  componentDidUpdate() {
    this.checkAndCollapse()
  }

  render() {
    return (
      <div className="kiwi-breadcrumb">
        {this.state.fold ? (
          <>
            {this.state.fold.start === 0 ? (
              <>
                {this._renderFoldedList(this.state.items.slice(0, this.state.fold.end))}
                {this._renderList(this.state.items.slice(this.state.fold.end))}
              </>
            ) : (
              <>
                {this._renderList(this.state.items.slice(0, this.state.fold.start))}
                {this._renderFoldedList(this.state.items.slice(this.state.fold.start, this.state.fold.end))}
                {this._renderList(this.state.items.slice(this.state.fold.end))}
              </>
            )}
          </>
        ) : (
          <>{this._renderList(this.state.items)}</>
        )}
      </div>
    )
  }

  _renderList(items: BreadcrumbItem[]): JSX.Element[] {
    if (items.length === 0) return []
    const elements = []
    items.forEach(item => {
      elements.push(<div key={`${item.uri}-chevron`} className="ms-Icon ms-Icon--ChevronRight"></div>)
      elements.push(
        <button
          className="kiwi-breadcrumb-item"
          key={item.uri}
          onClick={
            this.props.onItemClick
              ? _ => {
                  this.props.onItemClick(item)
                }
              : null
          }
        >
          {item.name}
        </button>
      )
    })
    return elements.slice(1)
  }

  _renderFoldedList(items: BreadcrumbItem[]): JSX.Element {
    if (items.length === 0) return <></>
    return (
      <MenuButton
        name="none"
        iconName="ChevronDown"
        iconOnly={true}
        key="fold"
        style={{paddingLeft: 5, paddingRight: 5}}
        menuProps={{
          items: items.map(it => {
            return {
              id: it.uri,
              text: it.name,
              onClick: this.props.onItemClick
                ? _ => {
                    this.props.onItemClick(it)
                  }
                : null,
            }
          }),
          styles: {
            text: {
              fontSize: '1.2rem',
              fontFamily: 'var(--sansSerifFont)',
              height: '2rem',
              paddingLeft: 5,
              paddingRight: 5,
            },
          },
        }}
      />
    )
  }
}

export {Breadcrumb}
