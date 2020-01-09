import { createLogger, format, transports } from 'winston'
import * as logform from 'logform'

let logging_level: string = 'debug'

function init(level: string) {
  logging_level = level
}

function get_logger(module_name: string) {
  const logger = createLogger({
    level: logging_level,
    format: format.combine(
      format.printf((info: logform.TransformableInfo): string => {
        return `[${info.level}] ${module_name}: ${info.message}`
      })
    ),
    transports: [
      new transports.Console()
    ]
  })
  return logger
}

export {
  init,
  get_logger
}
