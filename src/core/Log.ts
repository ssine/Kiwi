import { createLogger, format, transports } from 'winston'
import * as logform from 'logform'

let loggingLevel = 'debug'

function initLogger(level: string) {
  loggingLevel = level
}

function getLogger(moduleName: string) {
  const logger = createLogger({
    level: loggingLevel,
    format: format.combine(
      format.printf((info: logform.TransformableInfo): string => {
        return `[${info.level}] ${moduleName}: ${info.message}`
      })
    ),
    transports: [new transports.Console()],
  })
  return logger
}

export { initLogger, getLogger }
