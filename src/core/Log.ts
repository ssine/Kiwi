import { createLogger, format, transports } from 'winston'
import * as Transport from 'winston-transport'
import * as logform from 'logform'
import { timeFormat } from './Common'
import * as fs from 'fs'
import * as path from 'path'

let loggingLevel = 'debug'
let tps: Transport[] = []

export function initLogger(level: string, logPath?: string) {
  loggingLevel = level
  tps = [new transports.Console()]
  if (logPath) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    tps.push(
      new transports.File({
        level: 'silly',
        filename: logPath,
        maxsize: 1024 * 1024 * 5, // 5MB per log file
        maxFiles: 10,
        tailable: true,
      })
    )
  }
}

export function getLogger(moduleName: string) {
  const logger = createLogger({
    level: loggingLevel,
    format: format.combine(
      format.printf((info: logform.TransformableInfo): string => {
        return `${timeFormat('YYYY-MM-DD HH:mm:ss', new Date())} | ${info.level} | ${moduleName} | ${info.message}`
      })
    ),
    transports: tps,
  })
  return logger
}
