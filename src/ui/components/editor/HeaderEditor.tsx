import React, { CSSProperties } from 'react'
import { getMimesWhichPropEquals, MIME } from '../../../core/MimeType'
import { isMobile } from '../../Common'
import { IconButton } from '../basic/Button/IconButton'
import { Input } from '../basic/Input/Input'
import { Select } from '../basic/Select/Select'
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
}

const nameStyle: CSSProperties = {
  height: '100%',
  border: 'none',
  outline: 'none',
  paddingBottom: '2px black',
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
  alignItems: 'center',
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
            style={{ width: '100%', height: '100%', fontSize: '1rem' }}
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
            style={{ width: '100%', height: '100%', fontSize: '1rem' }}
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
            style={{ display: 'flex', flexDirection: 'row', height: '90%' }}
            tags={Array.isArray(entry.value) ? entry.value : [String(entry.value)]}
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
        <div className="item-header-name" style={{ width: '20%', height: '100%' }}>
          <Input style={{ height: '100%', fontSize: '1rem' }} disabled={true} value="type" />
        </div>
        <Select value="enum" disabled={true} style={typeStyle}>
          <option value="enum">enum</option>
        </Select>
        <Select
          value={type}
          onSelect={value => {
            setType(value as MIME)
          }}
          style={valueStyle}
        >
          {Object.entries(editorTypes).map(([group, types]) => {
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
        </Select>
        <IconButton disabled={true} styles={{ root: { height: '100%', width: HEIGHT } }} iconName="Delete" />
      </div>
      {entries.map((entry, idx) => (
        <div key={idx} style={rowStyle}>
          <div className="item-header-name" style={{ width: '20%', height: '100%' }}>
            <Input
              style={{ height: '100%', fontSize: '1rem' }}
              value={entry.name}
              onChange={val => {
                entry.name = val
                setEntries([...entries])
              }}
            />
          </div>
          <Select
            value={entry.type}
            onSelect={value => {
              entry.type = value
              if (value === 'list' && !Array.isArray(entry.value))
                entry.value = entry.value === '' ? [] : [String(entry.value)]
              setEntries([...entries])
            }}
            style={typeStyle}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="list">list</option>
          </Select>
          <div className="item-header-value" style={valueStyle}>
            {renderEntryValue(entry)}
          </div>
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

const editorTypes = {
  content: ['text/plain', 'text/markdown', 'text/html', 'text/asciidoc', 'text/wikitext'],
  image: ['image/x-icon', 'image/jpeg', 'image/png'],
  code: [
    'application/json',
    'text/css',
    'text/yaml',
    'text/x-c',
    'text/x-cpp',
    'text/x-python',
    'text/x-java',
    'text/javascript',
    'text/x-typescript',
  ],
}
