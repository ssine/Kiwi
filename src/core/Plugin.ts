import { getLogger } from './Log'
import * as he from 'he'
import * as vm from 'vm'
import { cloneRegex } from './Common'

const logger = getLogger('plugin')

type renderFunction = (...args: any[]) => Promise<string>

let pluginMap: { [name: string]: RenderPlugin } = {}

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

const processRenderPlugin = async function processRenderPlugin(uri: string, raw: string, ctx: ItemContext): Promise<string> {
  const macroCall = async (s: string): Promise<string> => {
    logger.silly(`eval macro call ${he.decode(s).slice(2, -2)}`)
    let res = ''
    try {
      if (/d[\s]/.test(s.slice(2, 4))) await ctx.eval(he.decode(s).slice(3, -2))
      else res = await ctx.eval(he.decode(s).slice(2, -2))
    } catch (err) {
      res = err
    }
    return res
  }

  let target = raw
  let patt = cloneRegex(macroReg)
  let match: RegExpExecArray | null = null
  let executionCount = 0;

  while (match = patt.exec(target)) {
    target =
      target.slice(0, match.index) +
      await macroCall(match[0]) +
      target.slice(match.index + match[0].length)
    patt.lastIndex = 0

    executionCount++
    if (executionCount > 10000) {
      target = 'Number of macro calls exceeds limit(10000).'
      break
    }
  }

  return target.replace(/\\{{/g, '{{')
}

export {
  RenderPlugin,
  processRenderPlugin,
  ItemContext
}
