import React, { useEffect, useReducer, useState } from 'react'
import loadable from '@loadable/component'

export const MonacoEditor = loadable(() => import('react-monaco-editor'), {
  fallback: <div>loading editor...</div>,
})
