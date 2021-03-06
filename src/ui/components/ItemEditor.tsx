import React, { useEffect, useReducer, useRef, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { getEmPixels, isMobile, setToNewArray } from '../Common'
import { IconButton } from './basic/Button/IconButton'
import { MenuButton } from './basic/Button/MenuButton'
import { MonacoEditor } from './editor/MonacoEditor'
import { TagsEditor } from './editor/TagsEditor'
import { TitleEditorComponent } from './editor/TitleEditor'
import { getMonacoLangFromType, MIME } from '../../core/MimeType'
import { HeaderEditor, HeaderEntry } from './editor/HeaderEditor'
import { ItemHeader } from '../../core/BaseItem'
import { resolveURI, timeFormat } from '../../core/Common'
import { ItemManager } from '../ItemManager'

const manager = ItemManager.getInstance()

export const ItemEditor = (props: {
  uri: string
  item: ClientItem
  onSave: (uri: string, item: ClientItem) => void
  onCancel: () => void
  fullscreen: boolean
  setFullscreen: (fullscreen: boolean) => void
}) => {
  const { uri: originalUri, item: originalItem, onSave: saveCallback, onCancel, fullscreen, setFullscreen } = props

  // split parts to edit: uri, title, type, tags
  const [uri, setUri] = useState(originalUri)
  const [title, setTitle] = useState(originalItem.title)
  const [headerEntries, setHeaderEntries] = useState(headerToEntry(originalItem.header))
  const [type, setType] = useState(originalItem.type)

  // ref to monaco editor, contents are managed by monaco editor
  const monacoRef = useRef(null)
  // ref to monaco editor container and resizer, used for resize
  const moncaoContainerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    moncaoContainerRef.current.addEventListener('paste', async ev => {
      const files = ev.clipboardData.files
      if (files && files.length > 0) {
        for (let idx = 0; idx < files.length; idx++) {
          const file = files[idx]
          if (file.type.indexOf('image') !== -1) {
            const ext = file.name.match(/\.\S+?$/)[0].substr(1)
            const fn = `asset/${timeFormat('YYYY-MM-DD-HH-mm-ss-SSS', new Date())}.${ext}`
            await manager.saveItem(
              resolveURI(uri, fn),
              {
                title: 'Autouploaded Image',
                skinny: true,
                type: file.type as MIME,
                header: {},
                renderSync: false,
                renderedHTML: '',
              },
              file
            )
            monacoRef.current.trigger('keyboard', 'type', { text: `![img](${fn})` })
            ev.preventDefault()
          }
        }
      }
    })
  }, [])

  const onSave = () => {
    saveCallback(uri, {
      title: title,
      content: monacoRef.current.getValue(),
      type: type,
      header: {
        author: originalItem.header.author,
        createTime: originalItem.header.createTime,
        modifyTime: Date.now(),
        ...entryToHeader(headerEntries),
      },
      skinny: false,
      renderSync: false,
      renderedHTML: '',
    })
  }

  return (
    <div
      onKeyDown={evt => {
        if (evt.ctrlKey && evt.keyCode === 83) {
          onSave()
          evt.preventDefault()
        }
      }}
    >
      <TitleEditorComponent uri={uri} setUri={setUri} title={title} setTitle={setTitle}>
        {fullscreen ? (
          <IconButton
            iconName="FocusView"
            onClick={() => {
              setFullscreen(false)
              setTimeout(() => {
                monacoRef.current.layout()
              }, 0)
            }}
          />
        ) : (
          <IconButton
            iconName="FullView"
            onClick={() => {
              setFullscreen(true)
              setTimeout(() => {
                monacoRef.current.layout()
              }, 0)
            }}
          />
        )}
        <IconButton iconName="Accept" onClick={onSave} />
        <IconButton iconName="RevToggleKey" onClick={onCancel} />
      </TitleEditorComponent>
      <div
        className="kiwi-edit-item-content"
        ref={moncaoContainerRef}
        onDragOver={evt => {
          evt.preventDefault()
        }}
      >
        <MonacoEditor
          language={getMonacoLangFromType(type)}
          defaultValue={originalItem.content || ''}
          automaticLayout={true}
          options={{
            lineDecorationsWidth: 0,
            wordWrap: 'on',
            wrappingIndent: 'same',
            tabSize: 2,
            fontSize: getEmPixels(),
          }}
          editorDidMount={(editor: any) => {
            editor.layout()
            editor.focus()
            monacoRef.current = editor
          }}
        />
      </div>
      <div
        ref={resizerRef}
        style={{ width: '100%', height: 3, backgroundColor: 'var(--blockColorLight)', cursor: 'n-resize' }}
        draggable={false}
        onMouseDown={evt => {
          const yDif = evt.pageY - (resizerRef.current.getBoundingClientRect().top + window.scrollY)
          const onResizeMouseMove = (mvEvt: MouseEvent) => {
            const c: HTMLDivElement = moncaoContainerRef.current
            c.style.height = `${mvEvt.pageY - (c.getBoundingClientRect().top + window.scrollY) - yDif}px`
            monacoRef.current.layout()
          }
          window.addEventListener('mousemove', onResizeMouseMove)
          window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', onResizeMouseMove)
          })
        }}
      ></div>
      <div className="item-header" style={{ minHeight: 35 }}>
        <HeaderEditor type={type} setType={setType} entries={headerEntries} setEntries={setHeaderEntries} />
      </div>
    </div>
  )
}

const headerToEntry = (header: ItemHeader): HeaderEntry[] => {
  const { author, createTime, modifyTime, ...custom } = header
  const entries = Object.entries(custom)
    .map(data => {
      const [key, val] = data
      if (Array.isArray(val)) {
        return { name: key, type: 'list', value: val }
      } else if (typeof val === 'number') {
        return { name: key, type: 'number', value: val }
      } else {
        return { name: key, type: 'string', value: val }
      }
    })
    .sort((a, b) => (a.name > b.name ? 1 : -1))
  return entries
}

const entryToHeader = (entries: HeaderEntry[]): ItemHeader => {
  return entries.reduce((acc, cur) => {
    if (!cur.name) return acc
    if (cur.type === 'number') {
      cur.value = Number(cur.value)
    }
    acc[cur.name] = cur.value
    return acc
  }, {})
}
