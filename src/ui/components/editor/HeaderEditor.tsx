import React, { CSSProperties } from 'react'
import { getMimesWhichPropEquals, MIME } from '../../../core/MimeType'
import { isMobile } from '../../Common'
import { IconButton } from '../basic/Button/IconButton'
import { Input } from '../basic/Input/Input'
import { TagsEditor } from './TagsEditor'

export type HeaderEntry = {
  name: string
  type: string
  value: string | number | string[]
}

const HEIGHT = isMobile ? '10vw' : '35px'

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  width: '100%',
  height: HEIGHT,
  paddingTop: 1,
  paddingBottom: 1,
}

const nameStyle: CSSProperties = {
  height: '100%',
  border: 'none',
}

const typeStyle: CSSProperties = {
  height: '100%',
  flex: '0 0 10%',
  border: 'none',
}

const valueStyle: CSSProperties = {
  display: 'flex',
  height: '100%',
  flex: `0 0 calc(70% - ${HEIGHT})`,
  border: 'none',
}

export const HeaderEditor = (props: {
  type: string
  setType: (type: MIME) => void
  entries: HeaderEntry[]
  setEntries: (entries: HeaderEntry[]) => void
}) => {
  const { type, setType, entries, setEntries } = props

  const renderEntryValue = (entry: HeaderEntry) => {
    switch (entry.type) {
      case 'string':
        return (
          <Input
            style={valueStyle}
            value={entry.value as string}
            onChange={val => {
              entry.value = val
              setEntries([...entries])
            }}
          />
        )
      case 'number':
        return (
          <Input
            style={valueStyle}
            value={String(entry.value) || ''}
            onChange={val => {
              entry.value = val
              setEntries([...entries])
            }}
          />
        )
      case 'list':
        return (
          <TagsEditor
            style={valueStyle}
            tags={entry.value as string[]}
            setTags={tags => {
              entry.value = tags
              setEntries([...entries])
            }}
          />
        )
    }
  }
  return (
    <>
      <div key={'type'} style={rowStyle}>
        <div className="item-header-name" style={{ width: '20%' }}>
          <Input
            style={nameStyle}
            value="type"
            disabled={true}
            onChange={val => {
              setType(val as MIME)
            }}
          />
        </div>
        <select className="kiwi-select" disabled={true}>
          <option value="enum">enum</option>
        </select>
        <select
          className="kiwi-select"
          value={type}
          onChange={value => {
            setType(value.target.value as MIME)
          }}
        >
          {['content', 'code'].map(group => {
            const types = getMimesWhichPropEquals('editorClass', group)
            return (
              <optgroup key={group} label={group}>
                {types.map(type => (
                  <option key={type} value={type} className="kiwi-select-option">
                    {type}
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>
      </div>
      {entries.map((entry, idx) => (
        <div key={idx} style={rowStyle}>
          <div className="item-header-name" style={{ width: '20%' }}>
            <Input
              style={nameStyle}
              value={entry.name}
              onChange={val => {
                entry.name = val
                setEntries([...entries])
              }}
            />
          </div>
          <select
            className="kiwi-select"
            value={entry.type}
            onChange={value => {
              entry.type = value.target.value
              setEntries([...entries])
            }}
            // style={typeStyle}
          >
            <option className="kiwi-select-option" value="string">
              string
            </option>
            <option className="kiwi-select-option" value="number">
              number
            </option>
            <option className="kiwi-select-option" value="list">
              list
            </option>
          </select>
          {renderEntryValue(entry)}
          <IconButton
            onClick={() => {
              entries.splice(idx, 1)
              setEntries([...entries])
            }}
            styles={{ root: { height: '100%', width: HEIGHT } }}
            iconName="Delete"
          />
        </div>
      ))}
      <div key={'add'} style={rowStyle}>
        <IconButton
          onClick={() => {
            setEntries([
              ...entries,
              {
                name: '',
                type: 'string',
                value: '',
              },
            ])
          }}
          styles={{ root: { width: '100%', height: '100%' } }}
          iconName="Add"
        />
      </div>
    </>
  )
}
