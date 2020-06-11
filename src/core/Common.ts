/**
 * A list of some MIME types
 * Partially supported
 */
type MIME = 
  'application/pdf' |
  'application/json' |
  'text/plain' |
  'text/markdown' |
  'text/javascript' |
  'text/html' |
  'text/css' |
  'text/asciidoc' |
  'text/wikitext' |
  'text/yaml' |
  'text/x-c' |
  'text/x-cpp' |
  'text/x-python' |
  'text/x-java' |
  'text/x-go' |
  'text/x-javascript' |
  'text/x-typescript' |
  'image/gif' |
  'image/x-icon' |
  'image/jpeg' |
  'image/png' |
  'image/svg+xml' |
  'audio/mpeg' |
  'audio/vnd.wav' |
  'video/mp4' |
  'video/ogg' |
  'video/webm'

const renderableMIME = new Set<MIME>([
  'text/plain',
  'text/markdown',
  'text/asciidoc',
  'text/wikitext',
  'text/html',
])

const extMIMEDict: { [name: string]: MIME } = {
  'md': 'text/markdown',
  'adoc': 'text/asciidoc',
  'wiki': 'text/wikitext',
  'gif': 'image/gif',
  'ico': 'image/x-icon',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'mp3': 'audio/mpeg',
  'wav': 'audio/vnd.wav',
  'mp4': 'video/mp4',
  'ogv': 'video/ogg',
  'webm': 'video/webm',
  'pdf': 'application/pdf',
  'json': 'application/json',
  'yml': 'text/yaml',
  'yaml': 'text/yaml',
  'css': 'text/css',
  'c': 'text/x-c',
  'cpp': 'text/x-cpp',
  'cc': 'text/x-cpp',
  'py': 'text/x-python',
  'java': 'text/x-java',
  'js': 'text/x-javascript',
  'ts': 'text/x-typescript',
  'tsx': 'text/x-typescript',
  'jsx': 'text/x-typescript',
}

const MIMEextDict: { [mime: string]: string } = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/asciidoc': 'adoc',
  'text/wikitext': 'wiki',
  'text/html': 'html',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/vnd.wav': 'wav',
  'video/mp4': 'mp4',
  'video/ogg': 'ogv',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
  'application/json': 'json',
  'text/yaml': 'yml',
  'text/css': 'css',
  'text/x-c': 'c',
  'text/x-cpp': 'cpp',
  'text/x-python': 'py',
  'text/x-java': 'java',
  'text/x-javascript': 'js',
  'text/x-typescript': 'ts',
}

const MIMELangDict: { [mime: string]: string } = {
  'application/json': 'json',
  'text/yaml': 'yaml',
  'text/x-c': 'cpp',
  'text/x-cpp': 'cpp',
  'text/css': 'css',
  'text/x-python': 'python',
  'text/x-java': 'java',
  'text/x-javascript': 'javascript',
  'text/x-typescript': 'typescript',
}

const editorMIMETypes = {
  content: [
    'text/markdown',
    'text/asciidoc',
    'text/plain',
    'text/html',
    'text/wikitext',
  ],
  code: [
    'text/x-c',
    'text/x-cpp',
    'text/x-python',
    'text/x-typescript',
    'text/x-javascript',
    'application/json',
    'text/yaml',
    'text/css',
    'text/x-java',
  ]
}

/**
 * Provide a file extension for content types
 */
function getExtensionFromMIME(ct: MIME | null): string {
  if (ct === null) return ''
  return MIMEextDict[ct] || 'txt' 
}

/**
 * Get the programming language from mime
 */
function getLanguageFromMIME(ct: MIME | null): string {
  if (ct === null) return ''
  const extra: { [mime: string]: string } = {
    'text/markdown': 'markdown',
    'text/asciidoc': 'asciidoc',
    'text/plain': 'plain',
    'text/html': 'html',
    'text/wikitext': 'wikitext',
  }
  return MIMELangDict[ct] || extra[ct] || 'txt' 
}



/**
 * Infer the MIME content type from file extension
 */
function getMIMEFromExtension(ext: string): MIME | null {
  ext = ext.replace(/^\.+/, '')
  return extMIMEDict[ext] || null
}

/**
 * assign all properties in obj that appeared in both objects to target
 */
function assignCommonProperties(target: Object, obj: Object) {
  for (let k in target) {
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
    }, timeoutMs);
  })
}

function cloneRegex(re: RegExp): RegExp {
  const flagMap: {[k: string]: string} = {
    global: 'g',
    ignoreCase: 'i',
    multiline: 'm',
    dotAll: 's',
    sticky: 'y',
    unicode: 'u'
  };
  
  // @ts-ignore
  const flags = Object.keys(flagMap).map(flag => re[flag] ? flagMap[flag] : '').join('');

	const clonedRegexp = new RegExp(re.source, flags);

	return clonedRegexp;
}

function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16)
  });
}

function trimString(s: string, c: string) {
  if (c.length !== 1) throw 'only one char trim supported!'
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}

function resolveURI(from: string | null, to: string): string {
  let stack: string[] = []

  const parseToStack = function (input: string) {
    let arr = input.split(/[\\\/]+/g)
    for (let unit of arr) {
      if (unit === '.') continue
      if (unit === '..') stack.pop()
      else stack.push(unit)
    }
  }

  if (typeof from === 'string' && to.trim()[0] !== '/')
    parseToStack(from)
  stack.pop()
  parseToStack(to)

  while (stack[0] === '') stack.shift()

  return stack.join('/')
}

function isURL(url: string): boolean {
  return /^(https?|ftp|file|mailto|tel|sms):\/\//.test(url)
}

function suggestedURIToTitle(uri: string): string {
  let title = uri.split('/').pop()
  if (! title) return 'No Title Suggestion'
  title = title.replace(/-/g, ' ')
  title = title.split(' ').map(word => word === '' ? '' : word[0].toUpperCase() + word.substr(1).toLowerCase()).join(' ')
  return title
}

function suggestedTitleToURI(title: string): string {
  let uri = title.replace(/\s+/g, '-')
  return uri.toLowerCase()
}

function extend<T, U>(a: T, b: U): T & U {
  let t: any = {}
  for (let k in a) {
    t[k] = a[k]
  }
  for (let k in b) {
    t[k] = b[k]
  }
  return t
}

export {
  MIME,
  renderableMIME,
  getMIMEFromExtension,
  getExtensionFromMIME,
  getLanguageFromMIME,
  MIMELangDict,
  assignCommonProperties,
  sleep,
  cloneRegex,
  editorMIMETypes,
  fixedEncodeURIComponent,
  trimString,
  resolveURI,
  isURL,
  suggestedURIToTitle,
  suggestedTitleToURI,
  extend,
}
