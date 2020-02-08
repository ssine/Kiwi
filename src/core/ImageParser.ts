import { Parser } from './Parser'
import { MIME } from './Common'

class ImageParser extends Parser {

  init() {
  }

  parse(kwargs: { input: string, uri: string, type: MIME }): string {
    if (kwargs.type === 'image/svg+xml') {
      return `<embed src="${kwargs.uri}" 
      type="image/svg+xml"
      style="max-width: 100%;"
      pluginspage="http://www.adobe.com/svg/viewer/install/" />`
    }
    return `<img src="${kwargs.uri}" type="${kwargs.type}" style="max-width: 100%;" />`
  } 

  supportedTypes(): MIME[] {
    return ['image/gif', 'image/x-icon', 'image/jpeg', 'image/png', 'image/svg+xml']
  }
}

export default ImageParser
