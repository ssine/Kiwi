import React from 'react'
import './SearchBox.css'

type SearchBoxProperty = {
  placeholder: string
  onChange: (newValue: string) => void
}

class SearchBox extends React.Component<SearchBoxProperty, {}> {
  inputEl: React.RefObject<HTMLInputElement>

  constructor(props: SearchBoxProperty) {
    super(props)
    this.inputEl = React.createRef()
  }

  render() {
    return (
      <div className="kiwi-searchbox-wrapper">
        <div className="kiwi-searchbox-icon-wrapper">
          <div className="ms-Icon ms-Icon--Search"></div>
        </div>
        <input
          type="text"
          placeholder={this.props.placeholder}
          ref={this.inputEl}
          onChange={evt => {
            this.props.onChange(this.inputEl.current.value)
          }}
        />
        {this.inputEl.current && this.inputEl.current.value !== '' && (
          <div
            className="kiwi-searchbox-clear-wrapper"
            onClick={() => {
              this.inputEl.current.value = ''
              this.props.onChange('')
            }}
          >
            <div className="ms-Icon ms-Icon--Cancel"></div>
          </div>
        )}
      </div>
    )
  }
}

export {SearchBox}
