import React, { useRef, useEffect, useLayoutEffect } from 'react'
import Painterro from 'painterro'

export type PainterEditorProps = {
  id: string
}

export const PainterEditor = (props: PainterEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (containerRef.current) {
      Painterro().show({
        id: props.id,
      })
    }
  }, [])

  return (
    <div
      id={props.id}
      className="painter-editor-container"
      style={{ height: '100%', width: '100%' }}
      ref={containerRef}
    ></div>
  )
}
