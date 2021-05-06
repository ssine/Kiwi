export type MIME = keyof typeof MimeProps

export const registerMimeType = (type: string, props?: Record<string, unknown>): void => {
  // @ts-ignore: external types
  MimeProps[type] = props || {}
}

export const isMimeHasProp = (type: MIME, prop: string): boolean => {
  return Object.keys(MimeProps[type]).includes(prop)
}

export const getMimeProps = (type: MIME): Record<string, unknown> => {
  // @ts-ignore
  return MimeProps[type]
}

export const isMimePropIncludes = (type: MIME, prop: string, content: string): boolean => {
  // @ts-ignore
  return MimeProps[type][prop]?.includes(content)
}

export const getMimesWithProp = (prop: string): MIME[] => {
  const res: MIME[] = []
  for (const [type, props] of Object.entries(MimeProps)) {
    if (Object.keys(props).includes(prop)) {
      res.push(<MIME>type)
    }
  }
  return res
}

export const getMimesWhichPropIncludes = (prop: string, content: unknown): MIME[] => {
  const res: MIME[] = []
  for (const [type, props] of Object.entries(MimeProps)) {
    // @ts-ignore
    if (Array.isArray(props[prop]) && props[prop].includes(content)) {
      res.push(<MIME>type)
    }
  }
  return res
}

export const isContentType = (type: MIME): boolean => {
  return isMimePropIncludes(type, 'tags', 'content')
}

export const isBinaryType = (type: MIME): boolean => {
  return isMimePropIncludes(type, 'tags', 'binary')
}

export const isTextType = (type: MIME): boolean => {
  return isMimePropIncludes(type, 'tags', 'text')
}

export const getTypeFromFileExt = (ext: string): MIME => {
  return getMimesWhichPropIncludes('extensions', ext)[0]
}

export const getFileExtFromType = (type: MIME): string | null => {
  // @ts-ignore
  return getMimeProps(type).extensions?.[0]
}

/**
 * extensions: file extension, content types should have only one extension to avoid multiple mapping
 * monacoLanguage: language id in monaco editor for intellisense
 * editorClass: class of item in item content type selection when editing
 */
const MimeProps = {
  'application/octet-stream': {
    tags: ['binary'],
    extensions: [],
  },
  'application/pdf': {
    tags: ['binary'],
    extensions: ['pdf'],
  },
  'application/json': {
    tags: ['text'],
    extensions: ['json'],
    monacoLanguage: 'json',
    editorClass: 'code',
  },
  'text/plain': {
    tags: ['text', 'content'],
    extensions: ['txt'],
    editorClass: 'content',
  },
  'text/markdown': {
    tags: ['text', 'content'],
    extensions: ['md'],
    editorClass: 'content',
  },
  'text/html': {
    tags: ['text', 'content'],
    extensions: ['html'],
    editorClass: 'content',
  },
  'text/css': {
    tags: ['text'],
    extensions: ['css'],
    monacoLanguage: 'css',
    editorClass: 'code',
  },
  'text/asciidoc': {
    tags: ['text', 'content'],
    extensions: ['adoc'],
    editorClass: 'content',
  },
  'text/wikitext': {
    tags: ['text', 'content'],
    extensions: ['wiki'],
    editorClass: 'content',
  },
  'text/yaml': {
    tags: ['text'],
    extensions: ['yml', 'yaml'],
    monacoLanguage: 'yaml',
    editorClass: 'code',
  },
  'text/x-c': {
    tags: ['text'],
    extensions: ['c'],
    monacoLanguage: 'cpp',
    editorClass: 'code',
  },
  'text/x-cpp': {
    tags: ['text'],
    extensions: ['cc', 'cpp'],
    monacoLanguage: 'cpp',
    editorClass: 'code',
  },
  'text/x-python': {
    tags: ['text'],
    extensions: ['py'],
    monacoLanguage: 'python',
    editorClass: 'code',
  },
  'text/x-java': {
    tags: ['text'],
    extensions: ['java'],
    monacoLanguage: 'java',
    editorClass: 'code',
  },
  'text/x-go': {
    tags: ['text'],
    extensions: ['go'],
    editorClass: 'code',
  },
  'text/javascript': {
    tags: ['text'],
    extensions: ['js', 'jsx'],
    monacoLanguage: 'javascript',
    editorClass: 'code',
  },
  'text/x-typescript': {
    tags: ['text'],
    extensions: ['ts', 'tsx'],
    monacoLanguage: 'typescript',
    editorClass: 'code',
  },
  'image/gif': {
    tags: ['binary'],
    extensions: ['gif'],
  },
  'image/x-icon': {
    tags: ['binary'],
    extensions: ['ico'],
  },
  'image/jpeg': {
    tags: ['binary'],
    extensions: ['jpg', 'jpeg'],
  },
  'image/png': {
    tags: ['binary'],
    extensions: ['png'],
  },
  'image/svg+xml': {
    tags: ['text'],
    extensions: ['svg'],
  },
  'audio/mpeg': {
    tags: ['binary'],
    extensions: ['mp3'],
  },
  'audio/vnd.wav': {
    tags: ['binary'],
    extensions: ['wav'],
  },
  'video/mp4': {
    tags: ['binary'],
    extensions: ['mp4'],
  },
  'video/ogg': {
    tags: ['binary'],
    extensions: ['ogv'],
  },
  'video/webm': {
    tags: ['binary'],
    extensions: ['webm'],
  },
}
