import React, { useState } from 'react'
import { Resizable, ResizeCallbackData } from 'react-resizable'
import { getEmPixels, getItemCardDiv } from '../../Common'
import { IconButton } from '../../components/basic/Button/IconButton'
import { TitleEditorComponent } from '../../components/editor/TitleEditor'
import { HeaderEditor, HeaderEntry } from '../../components/editor/HeaderEditor'
import { ItemHeader } from '../../../core/BaseItem'
import { useAppDispatch, useAppSelector } from '../../store'
import { deleteItem, saveItem } from '../global/item'
import { rotateIn, rotateOut, setItemFullScreen, setItemMode } from './operations'
import { DynamicMonacoEditor } from '../../components/editor/DynamicMonacoEditor'
import { ClientItem } from '../../ClientItem'
import { BitmapEditor } from '../../components/editor/BitmapEditor'
import { ResizeHandle } from '../../components/ResizeHandle'
import { getFileExtFromType, getTypeFromFileExt, isContentType, MIME } from '../../../core/MimeType'
import { last } from 'lodash'

export const ItemEditor = (props: { uri: string }) => {
  const { uri: originalUri } = props
  const originalItem = useAppSelector(s => s.items[originalUri] || s.systemItems[originalUri])
  const fullScreen = useAppSelector(s => s.opened.items[originalUri].fullScreen)
  const editorMap = useAppSelector(s => s.config.edit.editorMap)
  const defaultItemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const dispatch = useAppDispatch()

  // split parts to edit: uri, title, type, tags
  const [uri, setUri] = useState(originalUri)
  const [title, setTitle] = useState(originalItem.title)
  const [content, setContent] = useState(originalItem.content || '')
  const [binaryFile, setBinaryFile] = useState<File>()
  const [headerEntries, setHeaderEntries] = useState(headerToEntry(originalItem.header))
  const [type, setType] = useState(originalItem.type)
  const [saving, setSaving] = useState(false)
  const heightKey = fullScreen ? 'fullscreen-editor-height' : `editor-height-${uri}`
  const [editorHeight, setEditorHeight] = useState(parseInt(localStorage.getItem(heightKey) || '') || 400)

  const setItemType = (t: MIME) => {
    setType(t)
    if (isContentType(t)) {
      // content types don't have extensions in general,
      // so if any known extention exists, remove it.
      const ext = last(uri.split('.'))
      if (ext && getTypeFromFileExt(ext) === type) {
        setUri(uri.substring(0, uri.lastIndexOf('.')))
      }
      return
    }
    // non-content types requires a uri postfix to be set
    const ext = getFileExtFromType(t)
    if (!ext) return // not supported
    const lastSlash = uri.lastIndexOf('/')
    const lastDot = uri.lastIndexOf('.')
    if (lastDot === -1 || (lastSlash !== -1 && lastSlash > lastDot)) {
      // no current postfix on this uri, just add it
      setUri(`${uri}.${ext}`)
      return
    }
    const originalExtType = getTypeFromFileExt(uri.substring(lastDot + 1))
    if (originalExtType) {
      // some known extention exists
      if (originalExtType !== t) {
        // change it to new one
        setUri(`${uri.substring(0, lastDot)}.${ext}`)
        return
      } else {
        // do nothing
        return
      }
    } else {
      // unknown extension (or not an extension perhaps), append to it
      setUri(`${uri}.${ext}`)
    }
  }

  const editorType = editorMap[type]

  // FIXME: make saving logic more solid.
  // e.g. currently fails on type change -> failed to save -> type change back
  const onSave = async () => {
    const item: ClientItem = {
      title: title,
      content: content,
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
    }
    setSaving(true)
    try {
      await saveItem({
        uri,
        item: item,
        file: binaryFile,
      })
    } catch (err) {
      setSaving(false)
      return
    }
    if (originalUri !== uri) {
      await deleteItem(originalUri, uri)
    }
    // REVIEW: must be set after deleteItem replaces the old uri.
    dispatch(setItemMode({ uri: uri, mode: 'display' }))
    setSaving(false)
  }

  const onResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setEditorHeight(data.size.height)
    localStorage.setItem(heightKey, String(data.size.height))
  }

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
            }}
          />
        ) : (
          <IconButton
            iconName="FullView"
            onClick={() => {
              setItemFullScreen({ uri: originalUri, fullScreen: true })
            }}
          />
        )}
        <IconButton iconName="Accept" onClick={onSave} />
        <IconButton
          iconName="RevToggleKey"
          onClick={async () => {
            await rotateOut(getItemCardDiv(originalUri))
            dispatch(setItemMode({ uri: originalUri, mode: 'display' }))
            await rotateIn(getItemCardDiv(originalUri))
          }}
        />
      </TitleEditorComponent>
      <Resizable
        height={editorHeight}
        width={defaultItemWidth}
        onResize={onResize}
        handle={(handleAxis, ref) => (
          <ResizeHandle ref={ref} handleAxis={handleAxis} thickness={2} orientation="horizontal" showDots={false} />
        )}
      >
        <div style={{ height: editorHeight, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexGrow: 1, height: 'calc(100% - 3px)' }}>
            {editorType === 'monaco' ? (
              <DynamicMonacoEditor
                uri={uri}
                value={content}
                mimeType={type}
                setValue={setContent}
                options={{
                  lineDecorationsWidth: 0,
                  wordWrap: 'on',
                  wrappingIndent: 'same',
                  fontSize: getEmPixels(),
                  minimap: {
                    enabled: false,
                  },
                  lineNumbers: 'on',
                  lineNumbersMinChars: 3,
                  folding: true,
                  unicodeHighlight: {
                    allowedLocales: {
                      _os: true,
                      'zh-hans': true,
                      'zh-hant': true,
                    },
                  },
                }}
              />
            ) : editorType === 'bitmap' ? (
              <BitmapEditor uri={uri} mimeType={type} setContent={setBinaryFile} />
            ) : (
              <div>No editor for this mime type!</div>
            )}
          </div>
        </div>
      </Resizable>
      <div className="item-header" style={{ minHeight: 35 }}>
        <HeaderEditor type={type} setType={setItemType} entries={headerEntries} setEntries={setHeaderEntries} />
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
