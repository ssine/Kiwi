import React from 'react'
import './SearchBox.css'

type SearchBoxProperty = {
  placeholder: string
  onChange: (newValue: string) => void
}

// TODO: Add clear button on text exists
const SearchBox: React.FC<SearchBoxProperty> = (props) => {
  return <div className="kiwi-searchbox-wrapper">
    <div className="kiwi-searchbox-icon-wrapper">
      <div className="ms-Icon ms-Icon--Search"></div>
    </div>
    <input type="text" placeholder={props.placeholder} onChange={(evt) => {props.onChange(evt.target.value)}} />
  </div>
}

export { SearchBox }
