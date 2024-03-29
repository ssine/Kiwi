import { Parser } from '../../core/Parser'
import { fixedEncodeURIComponent } from '../../core/Common'
import { MIME } from '../../core/MimeType'

class MediaParser extends Parser {
  imageTypes: MIME[] = ['image/gif', 'image/x-icon', 'image/jpeg', 'image/png', 'image/svg+xml']
  videoTypes: MIME[] = ['video/mp4', 'video/ogg', 'video/webm']
  audioTypes: MIME[] = ['audio/mpeg', 'audio/vnd.wav']
  appTypes: MIME[] = ['application/pdf']

  init() {}

  parse(kwargs: { input: string; uri: string; type: MIME }): string {
    if (this.imageTypes.indexOf(kwargs.type) !== -1) {
      if (kwargs.type === 'image/svg+xml')
        return `<embed kiwi-raw src="/raw/${fixedEncodeURIComponent(
          kwargs.uri
        )}" type="image/svg+xml" style="max-width: 100%;" pluginspage="http://www.adobe.com/svg/viewer/install/" />`
      return `<img kiwi-raw src="/raw/${fixedEncodeURIComponent(kwargs.uri)}" type="${
        kwargs.type
      }" style="max-width: 100%;" />`
    } else if (this.videoTypes.indexOf(kwargs.type) !== -1) {
      return `<video kiwi-raw src="/raw/${fixedEncodeURIComponent(kwargs.uri)}" controls="controls" type="${
        kwargs.type
      }" style="max-width: 100%;">video tag not supported by your browser.</video>`
    } else if (this.audioTypes.indexOf(kwargs.type) !== -1) {
      return `<audio controls style="width: 100%;"><source kiwi-raw src="/raw/${fixedEncodeURIComponent(
        kwargs.uri
      )}" type="${kwargs.type}"></source>audio tag not supported by your browser.</audio>`
    } else if (kwargs.type === 'application/pdf') {
      return `<embed kiwi-raw src="/raw/${fixedEncodeURIComponent(
        kwargs.uri
      )}" type="application/pdf" style="width: 100%; height: 700px" />`
    }
    return `type ${kwargs.type} not supported!`
  }

  supportedTypes(): MIME[] {
    return ([] as MIME[]).concat(this.imageTypes, this.videoTypes, this.audioTypes, this.appTypes)
  }
}

export default MediaParser
