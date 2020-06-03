import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import { Callout, AttachDirection } from './basic/Callout/Callout'
import { SearchBox } from './basic/SearchBox/SearchBox'

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
    bus.once(`search-result-${token}`, (data: { items: ClientItem[] }) => {
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
          placeholder="Search..."
          onChange={async (newValue) => {
            if (newValue === '') this.setState({ isSearching: false })
            else this.setState({ isSearching: true })
            this.searchCount += 1
            const stamp = this.searchCount
            const results = await getSearchResult(newValue)
            if (stamp > this.searchResultStamp) {
              this.setState({ searchResults: results })
              this.searchResultStamp = stamp
            }
          }}
        />
      </div>
      {this.state.isSearching && (
        <Callout target={this.searchBoxRef} width={this.searchBoxRef.current.clientWidth} direction={AttachDirection.bottomLeftEdge}>
          {this.state.searchResults.map(res => <div
            className='kiwi-search-item'
            onClick={_ => bus.emit('item-link-clicked', { targetURI: res.uri })} >
            {res.uri}
          </div>)}
          {this.state.searchResults.length} results found ...
        </Callout>
      )}
    </>
  }
}
