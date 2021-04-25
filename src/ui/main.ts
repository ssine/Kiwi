/**
 * This part runs in browser
 * @packageDocumentation
 */
import '../kiwi/ui/css/global.css'
import 'highlight.js/styles/solarized-light.css'
import {language as mdLang} from 'monaco-editor/esm/vs/basic-languages/markdown/markdown'
import manager from './ItemManager'
import * as common from './Common'
import * as coreCommon from '../core/Common'
import eventBus from './eventBus'

async function run() {
  //@ts-ignore
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
    [/\}\}/, {token: 'keyword', bracket: '@close', next: '@pop', nextEmbedded: '@pop'}],
    [/[\s\S]*?/, 'variable.source'],
  ]

  const fabricFontStyle = document.createElement('link')
  fabricFontStyle.rel = 'stylesheet'
  fabricFontStyle.href = '/kiwi/ui/css/fabric-icons.css'
  document.head.append(fabricFontStyle)

  await manager.init()
  // @ts-ignore
  window.itemManager = manager
  // @ts-ignore
  window.eventBus = eventBus
  // @ts-ignore
  window.postFile = common.postFile
  // @ts-ignore
  window.kiwiTools = coreCommon.extend(common, coreCommon)
}

window.onload = run
