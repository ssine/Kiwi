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

type fieldCodeMatchResult = { start: number, end: number } | null

function fieldCodeMatch(s: string): fieldCodeMatchResult {
  let lastLeftIndex = -1;
  for (let i = 0; i < s.length - 1; i++) {
    if (i != 0 && s[i - 1] == '\\') continue
    if (s[i] == '{' && s[i + 1] == '{') {
      lastLeftIndex = i;
    } else if (s[i] == '}' && s[i + 1] == '}') {
      if (lastLeftIndex != -1) {
        return {
          start: lastLeftIndex,
          end: i + 2
        }
      }
    }
  }
  return null;
}

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
  const fieldCall = async (s: string): Promise<string> => {
    logger.silly(`eval field code call ${he.decode(s).slice(2, -2)}`)
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
  let match: fieldCodeMatchResult = null
  let executionCount = 0;

  while (match = fieldCodeMatch(target)) {
    target =
      target.slice(0, match.start) +
      await fieldCall(target.slice(match.start, match.end)) +
      target.slice(match.end)

    executionCount++
    if (executionCount > 10000) {
      target = 'Number of field code calls exceeds limit(10000).'
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
