import React, { useEffect, useReducer, useRef, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { getEmPixels, isMobile, setToNewArray } from '../Common'
import { IconButton } from './basic/Button/IconButton'
import { MenuButton } from './basic/Button/MenuButton'
import { MonacoEditor } from './editor/MonacoEditor'
import { TagsComponent } from './editor/TagsEditor'
import { TitleEditorComponent } from './editor/TitleEditor'
import { getMonacoLangFromType, MIME } from '../../core/MimeType'

export const ItemEditor = (props: {
  uri: string
  item: ClientItem
  onSave: (uri: string, item: ClientItem) => void
  onCancel: () => void
}) => {
  const { uri: originalUri, item: originalItem, onSave: saveCallback, onCancel } = props

  // split parts to edit: uri, title, type, tags
  const [uri, setUri] = useState(originalUri)
  const [title, setTitle] = useState(originalItem.title)
  const [type, setType] = useState(originalItem.type)
  const [tags, setTags] = useState(originalItem.header.tags || [])

  // ref to monaco editor, contents are managed by monaco editor
  const monacoRef = useRef(null)

  const onSave = () => {
    saveCallback(uri, {
      title: title,
      content: monacoRef.current.getValue(),
      type: type,
      header: {
        ...originalItem.header,
        tags: tags,
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
        <IconButton iconName="Accept" onClick={onSave} />
        <IconButton iconName="RevToggleKey" onClick={onCancel} />
      </TitleEditorComponent>
      <div className="edit-item-content">
        <MonacoEditor
          language={getMonacoLangFromType(type)}
          defaultValue={originalItem.content || ''}
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
      <div className="item-bottom-bar" style={{ minHeight: 35 }}>
        <div
          className="item-type"
          style={{
            width: isMobile ? '24vw' : 110,
            height: isMobile ? '10vw' : 33,
            float: 'left',
          }}
        >
          <MenuButton
            name={type.slice(5)}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid var(--lineColor)',
            }}
            menuProps={{
              items: ['text/markdown', 'text/asciidoc', 'text/plain', 'text/wikitext'].map(tp => {
                return {
                  id: tp,
                  text: tp.slice(5),
                  onClick: it => {
                    setType(it.id as MIME)
                  },
                }
              }),
              styles: {
                text: {
                  // height: 35,
                  paddingLeft: 5,
                  paddingRight: 5,
                },
              },
            }}
          />
        </div>
        <div className="item-tags">
          <TagsComponent tags={tags} setTags={setTags} />
        </div>
      </div>
    </div>
  )
}
