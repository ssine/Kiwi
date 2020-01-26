/**
 * A list of some MIME types
 * Partially supported
 */
type MIME = 
  'application/pdf' |
  'text/plain' |
  'text/markdown' |
  'text/javascript' |
  'text/html' |
  'text/asciidoc' |
  'text/wikitext' |
  'text/x-sqrl' |
  'image/gif' |
  'image/x-icon' |
  'image/jpeg' |
  'image/png' |
  'image/svg+xml'

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
  'sqrl': 'text/x-sqrl',
  'svg': 'image/svg+xml',
}

const MIMEextDict: { [mime: string]: string } = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/asciidoc': 'adoc',
  'text/wikitext': 'wiki',
  'text/html': 'html',
  'text/x-sqrl': 'sqrl',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
}

/**
 * Provide a file extension for content types
 */
function getExtensionFromMIME(ct: MIME | null): string {
  if (ct === null) return ''
  return MIMEextDict[ct] || 'txt' 
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

export {
  MIME,
  renderableMIME,
  getMIMEFromExtension,
  getExtensionFromMIME,
  assignCommonProperties
}
