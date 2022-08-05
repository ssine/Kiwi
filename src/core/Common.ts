/**
 * assign all properties in obj that appeared in both objects to target
 */
function assignCommonProperties(target: Object, obj: Object) {
  for (const k in target) {
    if (target.hasOwnProperty(k) && obj.hasOwnProperty(k)) {
      // ugly to ts but fits our need
      // @ts-ignore
      target[k] = obj[k]
    }
  }
}

function sleep(timeoutMs: number): Promise<void> {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res()
    }, timeoutMs)
  })
}

function cloneRegex(re: RegExp): RegExp {
  const flagMap: { [k: string]: string } = {
    global: 'g',
    ignoreCase: 'i',
    multiline: 'm',
    dotAll: 's',
    sticky: 'y',
    unicode: 'u',
  }

  const flags = Object.keys(flagMap)
    // @ts-ignore
    .map(flag => (re[flag] ? flagMap[flag] : ''))
    .join('')

  const clonedRegexp = new RegExp(re.source, flags)

  return clonedRegexp
}

/**
 * RFC 3986 URI encoding
 * [see] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 * @param str the uri to encode
 * @returns the encoded uri
 */
function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => {
    return '%' + c.charCodeAt(0).toString(16)
  })
}

// ignore '/' only
function encodeItemURI(str: string) {
  return fixedEncodeURIComponent(str).replace(/%2F/g, '/')
}

function trimString(s: string, c: string) {
  if (c.length !== 1) throw 'only one char trim supported!'
  if (c === ']') c = '\\]'
  if (c === '\\') c = '\\\\'
  return s.replace(new RegExp('^[' + c + ']+|[' + c + ']+$', 'g'), '')
}

function resolveURI(from: string | null, to: string): string {
  const stack: string[] = []

  const parseToStack = function (input: string) {
    const arr = input.split(/[\\\/]+/g)
    for (const unit of arr) {
      if (unit === '.') continue
      if (unit === '..') stack.pop()
      else stack.push(unit)
    }
  }

  if (typeof from === 'string' && to.trim()[0] !== '/') parseToStack(from)
  stack.pop()
  parseToStack(to)

  while (stack[0] === '') stack.shift()

  return stack.join('/')
}

function isURL(url: string): boolean {
  return /^((https?|ftp|file):\/\/)|((mailto|tel|sms):)/.test(url)
}

function suggestedURIToTitle(uri: string): string {
  let title = uri.split('/').pop()
  if (!title) return 'No Title Suggestion'
  title = title.replace(/-/g, ' ')
  title = title
    .split(' ')
    .map(word => (word === '' ? '' : word[0].toUpperCase() + word.substr(1).toLowerCase()))
    .join(' ')
  return title
}

function suggestedTitleToURI(title: string): string {
  const uri = title.replace(/\s+/g, '-')
  return uri.toLowerCase()
}

function extend<T, U>(a: T, b: U): T & U {
  const t: any = {}
  for (const k in a) {
    t[k] = a[k]
  }
  for (const k in b) {
    t[k] = b[k]
  }
  return t
}

function timeFormat(fmt: string, date: Date): string {
  const opt: Record<string, string> = {
    'Y+': date.getFullYear().toString(),
    'M+': (date.getMonth() + 1).toString(),
    'D+': date.getDate().toString(),
    'H+': date.getHours().toString(),
    'm+': date.getMinutes().toString(),
    's+': date.getSeconds().toString(),
    'S+': date.getMilliseconds().toString(),
  }
  for (const k in opt) {
    const ret = new RegExp('(' + k + ')').exec(fmt)
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'))
    }
  }
  return fmt
}

const argFact = (compareFn: (a: number[], b: number[]) => number[]) => (array: number[]) =>
  array.map((el, idx) => [el, idx]).reduce(compareFn)[1]

export const argMax = argFact((min, el) => (el[0] > min[0] ? el : min))
export const argMin = argFact((max, el) => (el[0] < max[0] ? el : max))

export function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  if ('code' in (e as any)) return true
  else return false
}

export const arrayEqual = (a: any[], b: any[]) => {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}

export const uriCumSum = (uri: string) => {
  const segments = uri.split('/')
  const sums: string[] = []
  for (let i = 0; i < segments.length; i++) {
    sums.push(segments.slice(0, i + 1).join('/'))
  }
  return sums
}

export {
  assignCommonProperties,
  sleep,
  cloneRegex,
  fixedEncodeURIComponent,
  encodeItemURI,
  trimString,
  resolveURI,
  isURL,
  suggestedURIToTitle,
  suggestedTitleToURI,
  extend,
  timeFormat,
}
