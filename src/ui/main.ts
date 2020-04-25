/**
 * This part runs in browser
 * @packageDocumentation
 */
import '../kiwi/ui/css/global.css'
import 'highlight.js/styles/solarized-light.css'
import { language as mdLang } from 'monaco-editor/esm/vs/basic-languages/markdown/markdown'
import manager from './ItemManager'
import { postFile } from './common'

async function run() {
  mdLang.tokenizer.root.unshift([/\{\{/, { token: 'keyword', bracket: '@open', next: '@macroblock', nextEmbedded: 'javascript' }])
  mdLang.tokenizer.macroblock = [
    [/\}\}/, { token: 'keyword', bracket: '@close', next: '@pop', nextEmbedded: '@pop' }],
    [/[\s\S]*?/, 'variable.source'],
  ]
  await manager.init()
  // @ts-ignore
  window.itemManager = manager
  // @ts-ignore
  window.postFile = postFile
  // @ts-ignore
}

window.onload = run
