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
  const matched = async (s: string): Promise<string> => {
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
  const unmatched = async (s: string): Promise<string> => {
    return s
  }

  let target = raw
  let patt = cloneRegex(macroReg)
  let match: RegExpExecArray | null = null
  while (match = patt.exec(target)) {
    let processed = await unmatched(target.slice(0, match.index)) + await matched(match[0])
    target = processed + target.slice(match.index + match[0].length)
    patt.lastIndex = 0
  }

  return target.replace(/\\{{/g, '{{')
}

export {
  RenderPlugin,
  processRenderPlugin,
  ItemContext
}
