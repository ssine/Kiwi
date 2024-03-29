import React, { useState } from 'react'
import { Callout, AttachDirection } from './basic/Callout/Callout'
import { SearchBox } from './basic/SearchBox/SearchBox'
import { getSearchResult } from '../api'
import { displayItem } from '../features/global/item'

export const SearchBar = () => {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<string[]>([])

  return (
    <Callout
      visible={searchResults.length > 0}
      direction={AttachDirection.bottomLeftEdge}
      alignWidth={true}
      content={
        <>
          {searchResults.map(uri => (
            <div className="kiwi-search-item" key={uri} onClick={() => displayItem(uri)}>
              {uri}
            </div>
          ))}
          {searchResults.length} results found ...
        </>
      }
    >
      <SearchBox
        placeholder="Search..."
        onChange={async newValue => {
          if (newValue === '') {
            setIsSearching(false)
            setSearchResults([])
          } else {
            setIsSearching(true)
            const results = await getSearchResult(newValue)
            setSearchResults(results)
          }
        }}
      />
    </Callout>
  )
}
