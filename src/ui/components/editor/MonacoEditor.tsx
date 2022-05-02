import React, { useRef, useEffect, useLayoutEffect } from 'react'
import * as monaco from 'monaco-editor'
import * as prettier from 'prettier'
import * as prettierPluginMarkdown from 'prettier/parser-markdown'

export type MonacoEditorProps = {
  language: string
  defaultValue?: string
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  editorDidMount?: (editor: monaco.editor.IStandaloneCodeEditor) => any
}

export const MonacoEditor = (props: MonacoEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  let editor: monaco.editor.IStandaloneCodeEditor
  useEffect(() => {
    if (containerRef.current) {
      editor = monaco.editor.create(containerRef.current, {
        ...props.options,
        value: props.defaultValue || props.options.value || '',
        language: props.language,
      })
      if (props.editorDidMount) {
        props.editorDidMount(editor)
      }
    }
    return () => {
      editor.dispose()
    }
  }, [])
  useLayoutEffect(() => {
    if (editor) {
      editor.layout()
    }
  })
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
