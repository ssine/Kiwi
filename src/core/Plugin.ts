import { getLogger } from './Log'
import * as he from 'he'
import * as vm from 'vm'
import { cloneRegex } from './Common'

const logger = getLogger('plugin')

type renderFunction = (...args: any[]) => Promise<string>

let pluginMap: {[name: string]: RenderPlugin} = {}

abstract class RenderPlugin {
  abstract init(): void
  abstract getNames(): string[]
  abstract getFunctionForItem(uri: string): renderFunction
  // use structural data for editor intellisense later
  getDescription(): string { return '' }
  register() {
    for (const name of this.getNames()) {
      pluginMap[name] = this
    }
    logger.info(`plugin ${this.getNames()[0]} registered.`)
  }
}

const forEachPiece = async function forEachPieceOfString(
  input: string,
  patt: RegExp,
  matched: (s: string) => Promise<void>,
  unmatched: (s: string) => Promise<void>) {
  let match: RegExpExecArray | null = null
  let lastIndex = 0
  while (true) {
    match = patt.exec(input)
    if (!match) {
      await unmatched(input.slice(lastIndex))
      break
    }
    await unmatched(input.slice(lastIndex, match.index))
    await matched(match[0])
    lastIndex = match.index + match[0].length
  }
}

const excludeReg = /<pre>[\s\S]*?<\/pre>/igm
// const macroReg = /\{\{[\s\S]*?\}\}/gm
const macroReg = /(?<!\\)\{\{[\s\S]*?\}\}/gm

class ItemContext {
  ctx: vm.Context

  constructor(uri: string) {
    this.ctx = {}
    for (const name in pluginMap) {
      this.ctx[name] = pluginMap[name].getFunctionForItem(uri)
    }
    this.ctx['currentURI'] = uri
    this.ctx.setTimeout = setTimeout
    this.ctx = vm.createContext(this.ctx)
  }

  async eval(x: string): Promise<any> {
    const res = vm.runInContext(x, this.ctx)
    if (res instanceof Promise) return await res
    else return res
  }

}

const processRenderPlugin = async function processRenderPlugin(uri: string, html: string): Promise<string> {
  let processed = ''
  const ctx = new ItemContext(uri)
  await forEachPiece(html, cloneRegex(macroReg),
    async (s) => {
      logger.silly(`eval macro call ${he.decode(s).slice(2, -2)}`)
      try {
        if (/d[\s]/.test(s.slice(2, 4))) await ctx.eval(he.decode(s).slice(3, -2))
        else processed += await ctx.eval(he.decode(s).slice(2, -2))
      } catch (err) {
        processed += err
      }
    },
    async (s) => {
      processed += s.replace(/\\{{/g, '{{')
    }
  )
  return processed
}

// const processRenderPlugin = async function processRenderPlugin(uri: string, html: string): Promise<string> {
//   let processed = ''
//   const ctx = new ItemContext()
//   await forEachPiece(html, excludeReg,
//     async (s) => { processed += s },
//     async (s) => { await forEachPiece(s, macroReg,
//       async (s) => {
//         logger.debug(`eval macro call ${he.decode(s).slice(2, -2)}`)
//         try {
//           if (/d[\s]/.test(s.slice(2, 4))) await ctx.eval(he.decode(s).slice(3, -2))
//           else processed += await ctx.eval(he.decode(s).slice(2, -2))
//         } catch (err) {
//           processed += err
//         }
//       },
//       async (s) => { processed += s }
//     )}
//   )
//   return processed
// }

export {
  RenderPlugin,
  processRenderPlugin
}
