export function ext_to_content_type(ext: string): string {
  ext = ext.replace(/^\.+/, '')
  const dict: { [name: string]: string } = {
    'md': 'markdown',
    'rst': 'resTructuredText'
  }
  return dict[ext] || 'unknown'
}