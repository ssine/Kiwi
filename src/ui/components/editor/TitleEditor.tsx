import React, { useState } from 'react'
import { resolveURI, suggestedTitleToURI, suggestedURIToTitle } from '../../../core/Common'
import { isMobile } from '../../Common'

export const TitleEditorComponent = (
  props: React.PropsWithChildren<{
    title?: string
    uri: string
    setTitle: (s: string) => void
    setUri: (u: string) => void
  }>
) => {
  const { title, uri, setTitle, setUri } = props
  const [titleChanged, setTitleChanged] = useState(false)
  const [uriChanged, setUriChanged] = useState(false)

  console.log(title, uri)
  const height = isMobile ? '12vw' : 40
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div className="item-uri-edit" style={{ flexGrow: 1, height: height }}>
          <input
            type="text"
            value={uri}
            onChange={evt => {
              setUriChanged(true)
              setUri(evt.target.value)
              if (!titleChanged) {
                setTitle(suggestedURIToTitle(evt.target.value))
              }
            }}
          />
        </div>
        <div className="item-controls" style={{ flexGrow: 0, display: 'flex' }}>
          {props.children}
        </div>
      </div>
      <div className="item-title-edit" style={{ height: height }}>
        <input
          type="text"
          value={title}
          onChange={evt => {
            setTitleChanged(true)
            setTitle(evt.target.value)
            if (!uriChanged) {
              setUri(resolveURI(uri, suggestedTitleToURI(evt.target.value)))
            }
          }}
          style={{ fontFamily: 'var(--serifFont)' }}
        />
      </div>
    </div>
  )
}
