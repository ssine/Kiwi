import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import { Callout } from 'office-ui-fabric-react'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { List } from 'office-ui-fabric-react/lib/List'
import { mergeStyleSets } from 'office-ui-fabric-react/lib/Styling'

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

export default class SearchBar extends React.Component<SearchBarProperty, SearchBarState> {
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
