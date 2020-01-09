/**
 * A list of some MIME types
 * Partially supported
 */
type MIME = 
  'application/pdf' |
  'text/plain' |
  'text/markdown' |
  'text/html' |
  'text/x-sqrl' |
  'image/gif' |
  'image/x-icon' |
  'image/jpeg' |
  'image/png' |
  'image/svg+xml'

const editable_content_type = new Set<MIME>()
editable_content_type.add('text/plain')
editable_content_type.add('text/markdown')
editable_content_type.add('text/html')

/**
 * Infer the MIME content type from file extension
 */
function ext_to_content_type(ext: string): MIME | null {
  ext = ext.replace(/^\.+/, '')
  const dict: { [name: string]: MIME } = {
    'md': 'text/markdown',
    'sqrl': 'text/x-sqrl'
  }
  return dict[ext] || null
}

/**
 * Provide a file extension for content types
 */
function content_type_to_ext(ct: MIME | null): string {
  if (!ct) return 'unk'
  let map = new Map<MIME, string>()
  map.set('application/pdf', 'pdf')
  map.set('text/plain', 'txt')
  map.set('text/markdown', 'md')
  map.set('text/html', 'html')
  map.set('text/x-sqrl', 'sqrl')
  map.set('image/gif', 'gif')
  map.set('image/x-icon', 'ico')
  map.set('image/jpeg', 'jpg')
  map.set('image/png', 'png')
  map.set('image/svg+xml', 'svg')
  return map.get(ct) || 'txt' 
}

export {
  MIME,
  editable_content_type,
  ext_to_content_type,
  content_type_to_ext
}
