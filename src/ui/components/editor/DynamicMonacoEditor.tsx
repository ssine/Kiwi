import React from 'react'
import loadable from '@loadable/component'

export const DynamicMonacoEditor = loadable(
  async () => {
    const module = await import('./MonacoEditor')
    return module.MonacoEditor
  },
  {
    fallback: <div>loading editor...</div>,
  }
)
