import * as path from 'path'
import * as fs from 'fs'
import { saveItem } from '../lib/storage/FilesystemStorage'
import { suggestedTitleToURI } from '../core/Common'

const convertTime = (from: string) => {
  const s = (l: number, r: number) => Number(from.slice(l, r))
  return Date.UTC(s(0, 4), s(4, 6), s(6, 8), s(8, 10), s(10, 12), s(12, 14), s(14, 17))
}

const convertMeta = (from: any) => {
  const to: any = {}
  if (from.created) {
    to.createTime = convertTime(from.created)
  }
  if (from.modified) {
    to.modifyTime = convertTime(from.modified)
  }
  if (from.creator) {
    to.author = from.creator
  }
  return to
}

export const migrateTiddlyWiki = async (from: string, to: string) => {
  const sourceFiles = await fs.promises.readdir(from)
  for (const sourceFile of sourceFiles) {
    if (sourceFile.startsWith('$')) continue
    if (sourceFile.endsWith('.tid')) {
      const content = (await fs.promises.readFile(path.join(from, sourceFile))).toString()
      const lines = content.split(/(\n|\r\n)/)
      const firstBlank = lines.indexOf('')
      const metaLines = lines.slice(0, firstBlank)
      const sourceMeta = Object.fromEntries(metaLines.map(l => l.split(':').map(v => v.trim())))
      const sourceContent = lines.slice(firstBlank + 1).join('\n')
      const targetContent = sourceContent
        .replace(/\n#+ /g, ss => '\n' + '  '.repeat(ss.length - 2) + '1.' + ' ') // ordered lists
        .replace(/\n\*+ /g, ss => '\n' + '  '.repeat(ss.length - 2) + '-' + ' ') // unordered lists
        .replace(/\n!+ /g, ss => '\n' + '#'.repeat(ss.length - 1) + ' ') // headers
        .replace(/^!+ /g, ss => '#'.repeat(ss.length) + ' ') // headers on top
        .replace(/''/g, '**') // strong
        .replace(/\{\{[\s\S]+?\}\}/g, ss => {
          const part = ss.slice(2, ss.length - 2)
          if (part.endsWith('.png') || part.endsWith('.jpg')) {
            return `![${part}](${suggestedTitleToURI(part)})`
          } else {
            return `[${part}](${suggestedTitleToURI(part)})`
          }
        }) // embed
        .replace(/\[\[[\s\S]+?\]\]/g, ss => {
          const part = ss.slice(2, ss.length - 2)
          if (ss.includes('|')) {
            const [name, pos] = part.split('|').slice(0, 2)
            return `[${name}](${suggestedTitleToURI(pos)})`
          }
          return `[${part}](${suggestedTitleToURI(part)})`
        }) //link
        .replace(/\[img\[[\s\S]+?\]\]/g, ss => {
          return `![](${suggestedTitleToURI(ss.slice(5, ss.length - 2))})`
        }) //image
      await saveItem(to, suggestedTitleToURI(sourceMeta.title), {
        title: sourceMeta.title,
        type: 'text/markdown',
        header: convertMeta(sourceMeta),
        content: targetContent,
        renderedHTML: '',
        renderSync: false,
      })
    } else if (sourceFile.endsWith('.meta')) {
      const content = (await fs.promises.readFile(path.join(from, sourceFile))).toString()
      const sourceMeta = Object.fromEntries(content.split('\n').map(l => l.split(':').map(v => v.trim())))
      await saveItem(to, suggestedTitleToURI(sourceFile.slice(0, sourceFile.length - 5)), {
        title: sourceMeta.title,
        type: sourceMeta.type,
        header: convertMeta(sourceMeta),
        renderedHTML: '',
        renderSync: false,
        content: await (
          await fs.promises.readFile(path.join(from, sourceFile.slice(0, sourceFile.length - 5)))
        ).toString(),
        getContentStream: () => fs.createReadStream(path.join(from, sourceFile.slice(0, sourceFile.length - 5))),
      })
    }
  }
}
