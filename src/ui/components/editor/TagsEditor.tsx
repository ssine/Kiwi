import React, { CSSProperties, useEffect, useReducer, useState } from 'react'
import { isMobile, setToNewArray } from '../../Common'
import { IconButton } from '../basic/Button/IconButton'

export const TagsEditor = (props: { tags: string[]; setTags: (tags: string[]) => void; style?: CSSProperties }) => {
  const { tags, setTags, style } = props
  const [isEditing, setIsEditing] = useState(Array(props.tags.length).fill(false))
  const [stagedValues, setStagedValues] = useState([...tags])

  return (
    <div style={style}>
      {stagedValues.map((tag, idx) => {
        if (isEditing[idx]) {
          return (
            <div key={idx} style={{ display: 'inline-flex', paddingLeft: 8 }}>
              <input
                defaultValue={tag}
                style={{ width: 80 }}
                onChange={evt => {
                  setStagedValues(setToNewArray(stagedValues, idx, evt.target.value))
                }}
              />
              <IconButton
                iconName="Accept"
                styles={{
                  root: { width: isMobile ? '10vw' : 32, height: '100%' },
                }}
                onClick={_ => {
                  if (stagedValues[idx] !== '') {
                    setTags(setToNewArray(tags, idx, stagedValues[idx]))
                    setIsEditing(setToNewArray(isEditing, idx, false))
                  }
                }}
              />
            </div>
          )
        } else {
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                border: '1px solid var(--lineColor)',
                marginLeft: 5,
              }}
            >
              <IconButton
                iconName="Edit"
                text={tag}
                styles={{
                  root: {
                    paddingLeft: 8,
                    width: 'unset',
                    height: '100%',
                    fontSize: '1em',
                  },
                  icon: { paddingLeft: 2, paddingRight: 2 },
                }}
                onClick={_ => {
                  setIsEditing(setToNewArray(isEditing, idx, true))
                }}
              />
              <IconButton
                iconName="Delete"
                styles={{
                  root: {
                    paddingLeft: 2,
                    paddingRight: 2,
                    width: 'unset',
                    height: '100%',
                    fontSize: '1em',
                  },
                }}
                onClick={_ => {
                  setTags(tags.filter((_, i) => i !== idx))
                  setIsEditing(isEditing.filter((_, i) => i !== idx))
                  setStagedValues(stagedValues.filter((_, i) => i !== idx))
                }}
              />
            </div>
          )
        }
      })}
      <IconButton
        iconName="Add"
        styles={{
          root: {
            height: '100%',
            width: isMobile ? '10vw' : 35,
            fontSize: isMobile ? '1.5rem' : 'inherit',
          },
        }}
        disabled={stagedValues[stagedValues.length - 1] === ''}
        onClick={_ => {
          setIsEditing([...isEditing, true])
          setStagedValues([...stagedValues, ''])
        }}
      />
    </div>
  )
}
