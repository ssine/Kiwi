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
  if (!(type in MimeProps)) return false
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

export const getMimesWhichPropEquals = (prop: string, value: unknown): MIME[] => {
  const res: MIME[] = []
  for (const [type, props] of Object.entries(MimeProps)) {
    // @ts-ignore
    if (props[prop] === value) {
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

export const getMonacoLangFromType = (type: MIME): string | null => {
  // @ts-ignore
  return getMimeProps(type).monacoLanguage
}

/**
 * extensions: file extension, content types should have only one extension to avoid multiple mapping
 * monacoLanguage: language id in monaco editor for intellisense
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
  },
  'text/plain': {
    tags: ['text', 'content'],
    extensions: ['txt'],
    monacoLanguage: 'plain',
  },
  'text/markdown': {
    tags: ['text', 'content'],
    extensions: ['md'],
    monacoLanguage: 'markdown',
  },
  'text/html': {
    tags: ['text', 'content'],
    extensions: ['html'],
    monacoLanguage: 'html',
  },
  'text/css': {
    tags: ['text'],
    extensions: ['css'],
    monacoLanguage: 'css',
  },
  'text/asciidoc': {
    tags: ['text', 'content'],
    extensions: ['adoc'],
    monacoLanguage: 'asciidoc',
  },
  'text/wikitext': {
    tags: ['text', 'content'],
    extensions: ['wiki'],
    monacoLanguage: 'wikitext',
  },
  'text/yaml': {
    tags: ['text'],
    extensions: ['yml', 'yaml'],
    monacoLanguage: 'yaml',
  },
  'text/x-c': {
    tags: ['text'],
    extensions: ['c'],
    monacoLanguage: 'cpp',
  },
  'text/x-cpp': {
    tags: ['text'],
    extensions: ['cc', 'cpp'],
    monacoLanguage: 'cpp',
  },
  'text/x-python': {
    tags: ['text'],
    extensions: ['py'],
    monacoLanguage: 'python',
  },
  'text/x-java': {
    tags: ['text'],
    extensions: ['java'],
    monacoLanguage: 'java',
  },
  'text/x-go': {
    tags: ['text'],
    extensions: ['go'],
    monacoLanguage: 'go',
  },
  'text/javascript': {
    tags: ['text'],
    extensions: ['js', 'jsx'],
    monacoLanguage: 'javascript',
  },
  'text/x-typescript': {
    tags: ['text'],
    extensions: ['ts', 'tsx'],
    monacoLanguage: 'typescript',
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
