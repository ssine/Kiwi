import React, { useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'
import * as prettier from 'prettier'
import * as prettierPluginMarkdown from 'prettier/parser-markdown'
import { MessageType, showMessage } from '../../features/messageList/messageListSlice'
import { resolveURI, timeFormat } from '../../../core/Common'
import { saveItem } from '../../features/global/item'
import { getMonacoLangFromType, MIME } from '../../../core/MimeType'

export type MonacoEditorProps = {
  uri: string
  value: string
  mimeType: MIME
  setValue: (v: string) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
}

export const MonacoEditor = (props: MonacoEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoLang = getMonacoLangFromType(props.mimeType) || 'plain'

  useEffect(() => {
    if (!containerRef.current) return

    // create monaco editor instance and focus
    const editor = monaco.editor.create(containerRef.current, {
      ...props.options,
      value: props.value,
      language: monacoLang,
    })
    editor.getModel()?.onDidChangeContent(() => {
      props.setValue(editor.getValue())
    })

    // resize monaco on container size change
    new ResizeObserver(() => {
      editor.layout()
    }).observe(containerRef.current)

    // on file paste
    containerRef.current.addEventListener('paste', ev => onMonacoFilePaste(ev, editor, props.uri))

    editor.focus()
    editorRef.current = editor
    return () => {
      editor.dispose()
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current) return
    const model = editorRef.current.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, monacoLang)
    }
  }, [monacoLang])

  return <div className="monaco-editor-container" style={{ height: '100%', width: '100%' }} ref={containerRef}></div>
}

monaco.languages.registerDocumentFormattingEditProvider('markdown', {
  provideDocumentFormattingEdits(model, options) {
    return [
      {
        range: model.getFullModelRange(),
        /**
         * Note: prettier will not add whitespaces between cjk and latin in v3.
         * See https://github.com/prettier/prettier/issues/6385
         */
        text: prettier.format(model.getValue(), {
          tabWidth: options.tabSize,
          parser: 'markdown',
          plugins: [prettierPluginMarkdown],
        }),
      },
    ]
  },
})

const onMonacoFilePaste = async (ev: ClipboardEvent, editor: monaco.editor.IStandaloneCodeEditor, uri: string) => {
  const files = ev.clipboardData?.files
  if (!files || files.length === 0) return
  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx]
    if (file.type.indexOf('image') !== -1) {
      const match = file.name.match(/\.\S+?$/)
      if (!match) {
        showMessage({
          type: MessageType.warning,
          text: `pasted file ${file.name} do not have extension name, ignored`,
          liveSecond: 5,
        })
        continue
      }
      const ext = match[0].substring(1)
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
      editor.trigger('keyboard', 'type', { text: `![img](${fn})` })
      ev.preventDefault()
    }
  }
}
