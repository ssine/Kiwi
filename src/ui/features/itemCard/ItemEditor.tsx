import React, { useEffect, useRef, useState } from 'react'
import { getEmPixels, getItemCardDiv } from '../../Common'
import { IconButton } from '../../components/basic/Button/IconButton'
import { TitleEditorComponent } from '../../components/editor/TitleEditor'
import { getMonacoLangFromType, MIME } from '../../../core/MimeType'
import { HeaderEditor, HeaderEntry } from '../../components/editor/HeaderEditor'
import { ItemHeader } from '../../../core/BaseItem'
import { resolveURI, timeFormat } from '../../../core/Common'
import { useAppDispatch, useAppSelector } from '../../store'
import { deleteItem, saveItem } from '../global/item'
import { rotateIn, rotateOut, setItemFullScreen, setItemMode } from './operations'
import { MessageType, showMessage } from '../messageList/messageListSlice'
import { DynamicMonacoEditor } from '../../components/editor/DynamicMonacoEditor'

export const ItemEditor = (props: { uri: string }) => {
  const { uri: originalUri } = props
  const originalItem = useAppSelector(s => s.items[originalUri] || s.systemItems[originalUri])
  const fullScreen = useAppSelector(s => s.opened.items[originalUri].fullScreen)
  const dispatch = useAppDispatch()

  // split parts to edit: uri, title, type, tags
  const [uri, setUri] = useState(originalUri)
  const [title, setTitle] = useState(originalItem.title)
  const [headerEntries, setHeaderEntries] = useState(headerToEntry(originalItem.header))
  const [type, setType] = useState(originalItem.type)
  const [saving, setSaving] = useState(false)

  // ref to monaco editor, contents are managed by monaco editor
  const monacoRef = useRef(null)
  // ref to monaco editor container and resizer, used for resize
  const moncaoContainerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    moncaoContainerRef.current?.addEventListener('paste', async ev => {
      const files = ev.clipboardData?.files
      if (files && files.length > 0) {
        for (let idx = 0; idx < files.length; idx++) {
          const file = files[idx]
          if (file.type.indexOf('image') !== -1) {
            const ext = file.name.match(/\.\S+?$/)[0].substring(1)
            const time = timeFormat('YYYY-MM-DD-HH-mm-ss-SSS', new Date())
            const fn = `asset/${time}.${ext}`
            showMessage({ type: MessageType.info, text: `uploading image as ${fn}`, liveSecond: 3 })
            await saveItem({
              uri: resolveURI(uri, fn),
              item: {
                title: `${time}.${ext}`,
                state: 'bare',
                type: file.type as MIME,
                header: {},
                renderSync: false,
                renderedHTML: '',
              },
              file,
            })
            showMessage({ type: MessageType.success, text: `image saved to ${fn}`, liveSecond: 3 })
            monacoRef.current.trigger('keyboard', 'type', { text: `![img](${fn})` })
            ev.preventDefault()
          }
        }
      }
    })
  }, [])

  const onSave = async () => {
    setSaving(true)
    try {
      await saveItem({
        uri,
        item: {
          title: title,
          content: monacoRef.current.getValue(),
          type: type,
          state: 'full',
          header: {
            author: originalItem.header.author,
            createTime: originalItem.header.createTime,
            modifyTime: Date.now(),
            ...entryToHeader(headerEntries),
          },
          renderSync: false,
          renderedHTML: '',
        },
      })
      if (originalUri !== uri) {
        await deleteItem(originalUri, uri)
      }
    } catch (err) {
      setSaving(false)
      return
    }
    dispatch(setItemMode({ uri: uri, mode: 'display' }))
    setSaving(false)
  }

  const heightKey = fullScreen ? 'fullscreen-editor-height' : `editor-height-${uri}`

  return (
    <div
      onKeyDown={evt => {
        if (evt.ctrlKey && evt.keyCode === 83) {
          onSave()
          evt.preventDefault()
        }
      }}
      style={
        saving
          ? {
              filter: 'blur(5px)',
            }
          : {}
      }
    >
      <TitleEditorComponent uri={uri} setUri={setUri} title={title} setTitle={setTitle}>
        {fullScreen ? (
          <IconButton
            iconName="FocusView"
            onClick={() => {
              setItemFullScreen({ uri: originalUri, fullScreen: false })
              setTimeout(() => {
                monacoRef.current.layout()
              }, 0)
            }}
          />
        ) : (
          <IconButton
            iconName="FullView"
            onClick={() => {
              setItemFullScreen({ uri: originalUri, fullScreen: true })
              setTimeout(() => {
                monacoRef.current.layout()
              }, 0)
            }}
          />
        )}
        <IconButton iconName="Accept" onClick={onSave} />
        <IconButton
          iconName="RevToggleKey"
          onClick={async () => {
            await rotateOut(getItemCardDiv(originalUri))
            dispatch(setItemMode({ uri: uri, mode: 'display' }))
            await rotateIn(getItemCardDiv(originalUri))
          }}
        />
      </TitleEditorComponent>
      <div
        className="kiwi-edit-item-content"
        ref={moncaoContainerRef}
        style={{ height: parseInt(localStorage.getItem(heightKey)) || 400 }}
        onDragOver={evt => {
          evt.preventDefault()
        }}
      >
        <DynamicMonacoEditor
          language={getMonacoLangFromType(type)}
          defaultValue={originalItem.content || ''}
          options={{
            lineDecorationsWidth: 0,
            wordWrap: 'on',
            wrappingIndent: 'same',
            fontSize: getEmPixels(),
            unicodeHighlight: {
              allowedLocales: {
                _os: true,
                'zh-hans': true,
                'zh-hant': true,
              },
            },
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
            const height = mvEvt.pageY - (c.getBoundingClientRect().top + window.scrollY) - yDif
            c.style.height = `${height}px`
            localStorage.setItem(heightKey, String(height))
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
