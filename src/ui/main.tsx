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
import { ItemManager } from './ItemManager'
import { eventBus } from './eventBus'
import * as common from './Common'
import * as coreCommon from '../core/Common'
import { setPageColors, CSSColorToRGBA, RGBtoHSV } from './Common'
import { pageConfigs } from '../boot/config'

window.onload = async () => {
  const manager = ItemManager.getInstance()
  await manager.init()
  initMonacoEditor()

  // fabric icons
  const fabricFontStyle = document.createElement('link')
  fabricFontStyle.rel = 'stylesheet'
  fabricFontStyle.href = '/kiwi/ui/css/fabric-icons.css'
  document.head.append(fabricFontStyle)

  // theme color
  await manager.ensureItemLoaded(pageConfigs.primaryColor)
  setPageColors(RGBtoHSV(CSSColorToRGBA(manager.getItem(pageConfigs.primaryColor).content)).h)

  // document title
  await manager.ensureItemLoaded(pageConfigs.title)
  document.title = manager.getItem(pageConfigs.title).content.trim()

  // document favicon
  const link = document.createElement('link')
  link.type = 'image/x-icon'
  link.rel = 'shortcut icon'
  link.href = '/' + pageConfigs.favicon
  document.getElementsByTagName('head')[0].appendChild(link)

  // render!
  const rootDiv = document.createElement('div')
  ReactDOM.render(<App />, rootDiv)
  document.body.append(rootDiv)

  // @ts-ignore
  window.itemManager = manager
  // @ts-ignore
  window.kiwiTools = coreCommon.extend(common, coreCommon)
  // @ts-ignore
  window.bus = eventBus
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
