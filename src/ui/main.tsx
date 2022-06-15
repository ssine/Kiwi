/**
 * This part runs in browser
 * @packageDocumentation
 */
import '../kiwi/ui/css/global.css'
import 'highlight.js/styles/solarized-light.css'
import { language as mdLang } from 'monaco-editor/esm/vs/basic-languages/markdown/markdown'
import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App'
import { setPageColors, CSSColorToRGBA, RGBtoHSV } from './Common'
import { pageConfigs } from '../boot/config'
import { ScriptApi } from './ScriptApi'
import { getItem, initItems, loadItem } from './features/global/item'
import { store } from './store'
import { setSubtitle, setTitle } from './features/global/title'

window.onload = async () => {
  await initItems()
  initMonacoEditor()

  // fabric icons
  const fabricFontStyle = document.createElement('link')
  fabricFontStyle.rel = 'stylesheet'
  fabricFontStyle.href = '/kiwi/ui/css/fabric-icons.css'
  document.head.append(fabricFontStyle)

  // theme color
  await Promise.all([loadItem(pageConfigs.primaryColor), loadItem(pageConfigs.title), loadItem(pageConfigs.subTitle)])
  setPageColors(RGBtoHSV(CSSColorToRGBA(getItem(pageConfigs.primaryColor).content!)).h)

  // document title & subtitle
  const title = getItem(pageConfigs.title).content!.trim()
  document.title = title
  store.dispatch(setTitle(title))
  store.dispatch(setSubtitle(getItem(pageConfigs.subTitle).content!.trim()))

  // document favicon
  const link = document.createElement('link')
  link.type = 'image/x-icon'
  link.rel = 'shortcut icon'
  link.href = '/raw/' + pageConfigs.favicon
  document.getElementsByTagName('head')[0].appendChild(link)

  // render!
  const rootDiv = document.createElement('div')
  ReactDOM.render(<App />, rootDiv)
  document.body.append(rootDiv)

  // @ts-ignore
  window.kiwi = ScriptApi

  window.addEventListener('beforeunload', (ev: BeforeUnloadEvent) => {
    if (Object.values(store.getState().opened.items).filter(i => i.mode === 'edit').length > 0) {
      ev.preventDefault()
      ev.returnValue = 'Please check and save opened editors before leaving.'
    } else {
      delete ev.returnValue
    }
  })
}

const initMonacoEditor = () => {
  mdLang.tokenizer.root.unshift([
    /\{\{/,
    {
      token: 'keyword',
      bracket: '@open',
      next: '@macroblock',
      nextEmbedded: 'javascript',
    },
  ])
  mdLang.tokenizer.macroblock = [
    [/\}\}/, { token: 'keyword', bracket: '@close', next: '@pop', nextEmbedded: '@pop' }],
    [/[\s\S]*?/, 'variable.source'],
  ]
}
