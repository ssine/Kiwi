import { getLogger } from '../Log'
import * as he from 'he'
import * as vm from 'vm'
import ts from 'typescript'
import { ScriptApi } from '../ScriptApi'
import { processTopLevelAwait } from './await'
import { resolveURI } from '../Common'
import { ItemNotExistsError } from '../Error'

const logger = getLogger('plugin')

type renderFunction = (...args: any[]) => Promise<string>

const pluginMap: { [name: string]: RenderPlugin } = {}

abstract class RenderPlugin {
  abstract init(): void
  abstract getNames(): string[]
  abstract getFunctionForItem(uri: string): renderFunction
  // use structural data for editor intellisense later
  getDescription(): string {
    return ''
  }
  register() {
    for (const name of this.getNames()) {
      pluginMap[name] = this
    }
    logger.debug(`plugin ${this.getNames()[0]} registered.`)
  }
}

type fieldCodeMatchResult = { start: number; end: number } | null

function fieldCodeMatch(s: string): fieldCodeMatchResult {
  let lastLeftIndex = -1
  for (let i = 0; i < s.length - 1; i++) {
    if (i != 0 && s[i - 1] == '\\') continue
    if (s[i] == '{' && s[i + 1] == '{') {
      lastLeftIndex = i
    } else if (s[i] == '}' && s[i + 1] == '}') {
      if (lastLeftIndex != -1) {
        return {
          start: lastLeftIndex,
          end: i + 2,
        }
      }
    }
  }
  return null
}

class ItemContext {
  ctx: vm.Context
  uri: string

  constructor(uri: string) {
    this.uri = uri
    this.ctx = {}
    const kiwi: Record<string, any> = { ...ScriptApi }
    for (const name in pluginMap) {
      kiwi[name] = pluginMap[name].getFunctionForItem(uri)
    }
    kiwi.uri = uri

    // TODO: deprecated this
    for (const name in pluginMap) {
      this.ctx[name] = pluginMap[name].getFunctionForItem(uri)
    }
    this.ctx['currentURI'] = uri

    this.ctx.kiwi = kiwi
    this.ctx.setTimeout = setTimeout
    this.ctx.console = console
    this.ctx.require = require
    this.ctx = vm.createContext(this.ctx)
  }

  async eval(x: string): Promise<any> {
    try {
      let code = ts.transpile(x, {
        target: ts.ScriptTarget.ES2021,
      })
      if (code.includes('await')) {
        const potentialWrappedCode = processTopLevelAwait(code)
        if (potentialWrappedCode !== null) {
          code = potentialWrappedCode
        }
      }
      const res = vm.runInContext(code, this.ctx, {
        //@ts-ignore
        importModuleDynamically: async (specifier: string) => {
          return loadKiwiModule(await resolveModuleUri(this.uri, specifier), this.ctx)
        },
      })
      if (res instanceof Promise) return await res
      else return res
    } catch (e) {
      return String(e)
    }
  }
}

const processRenderPlugin = async function processRenderPlugin(
  uri: string,
  raw: string,
  ctx: ItemContext
): Promise<string> {
  try {
    const fieldCall = async (s: string): Promise<string> => {
      logger.silly(`eval field code call ${he.decode(s).slice(2, -2)}`)
      let res = ''
      try {
        if (/d[\s]/.test(s.slice(2, 4))) await ctx.eval(he.decode(s).slice(3, -2))
        else res = await ctx.eval(he.decode(s).slice(2, -2))
      } catch (err) {
        res = String(err)
      }
      return res
    }

    let target = raw
    let match: fieldCodeMatchResult = null
    let executionCount = 0

    while ((match = fieldCodeMatch(target))) {
      target =
        target.slice(0, match.start) + (await fieldCall(target.slice(match.start, match.end))) + target.slice(match.end)

      executionCount++
      if (executionCount > 10000) {
        target = 'Number of field code calls exceeds limit(10000).'
        break
      }
    }

    return target.replace(/\\{{/g, '{{').replace(/\\}}/g, '}}')
  } catch (e) {
    return String(e)
  }
}

const resolveModuleUri = async (from: string, to: string) => {
  if (to.endsWith('.ts') || to.endsWith('.js')) {
    return resolveURI(from, to)
  } else {
    try {
      const tsuri = resolveURI(from, `${to}.ts`)
      await ScriptApi.getItem(tsuri)
      return tsuri
    } catch (e) {
      if (e instanceof ItemNotExistsError) {
        try {
          const jsuri = resolveURI(from, `${to}.js`)
          await ScriptApi.getItem(jsuri)
          return jsuri
        } catch (e) {
          throw e
        }
      } else {
        throw e
      }
    }
  }
}

const loadKiwiModule = async (uri: string, ctx: vm.Context) => {
  const item = await ScriptApi.getItem(uri)
  // @ts-ignore
  const module = new vm.SourceTextModule(
    ts.transpile(item.content || '', {
      target: ts.ScriptTarget.ES2021,
    }),
    {
      context: ctx,
      importModuleDynamically: async (specifier: string) => {
        return loadKiwiModule(await resolveModuleUri(uri, specifier), ctx)
      },
    }
  )
  await module.link(async (specifier: string, referencingModule: any) => {
    const target = await resolveModuleUri(uri, specifier)
    return loadKiwiModule(target, referencingModule.context)
  })
  await module.evaluate()
  return module
}

export { RenderPlugin, processRenderPlugin, ItemContext }
