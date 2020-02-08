import { Parser } from './Parser'
import { MIME } from './Common'

class VideoParser extends Parser {

  init() {
  }

  parse(kwargs: { input: string, uri: string, type: MIME }): string {
    return `<video src="${encodeURI(kwargs.uri)}" controls="controls" style="max-width: 100%;">
    您的浏览器不支持 video 标签。
    </video>`
  } 

  supportedTypes(): MIME[] {
    return ['video/mp4', 'video/ogg', 'video/webm']
  }
}

export default VideoParser
