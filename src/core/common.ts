/**
 * A list of some MIME types
 * Partially supported
 */
type MIME = 
  'application/pdf' |
  'text/plain' |
  'text/markdown' |
  'text/html' |
  'image/gif' |
  'image/x-icon' |
  'image/jpeg' |
  'image/png' |
  'image/svg+xml'

/**
 * Infer the MIME content type from file extension
 */
function ext_to_content_type(ext: string): MIME | null {
  ext = ext.replace(/^\.+/, '')
  const dict: { [name: string]: MIME } = {
    'md': 'text/markdown'
  }
  return dict[ext] || null
}

export {
  MIME,
  ext_to_content_type
}
