import { BaseItem } from './BaseItem'
import { parse } from './Parser'
import { processRenderPlugin, ItemContext } from './Plugin'
import { Readable } from 'stream'

export interface ServerItem extends BaseItem {
  getContentStream?: () => Readable
}

// /**
//  * Server Side Item Class
//  */
// class ServerItem extends BaseItem {
//   async html() {
//     if (!this.isContentParsed) {
//       const plged = await processRenderPlugin(this.uri, this.content, new ItemContext(this.uri))
//       this.parsedContent = parse({
//         input: plged,
//         uri: this.uri,
//         type: this.type || 'text/markdown',
//       })
//       // const html = parse(this.content, this.type || 'text/markdown')
//       // this.parsedContent = await processRenderPlugin(this.uri, html)
//       this.isContentParsed = true
//     }
//     return this.parsedContent
//   }
// }
