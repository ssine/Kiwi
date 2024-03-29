/**
 * The server
 * @packageDocumentation
 */
import * as http from 'http'
import express from 'express'
import * as bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import fileUpload from 'express-fileupload'
import compression from 'compression'
import { getLogger } from './Log'
import { MIME } from './MimeType'
import { resolve } from 'path'
import { trimString, uriCumSum } from './Common'
import * as fs from 'fs'
import { ItemManager, toClientItem } from './ItemManager'
import { ServerItem } from './ServerItem'
import {
  InvalidTokenError,
  ItemNotExistsError,
  KiwiError,
  LoginRequiredError,
  NoReadPermissionError,
  UploadFileError,
} from './Error'
import { isBinaryType } from './MimeType'
import { Readable } from 'stream'
import { ClientItem } from '../ui/ClientItem'
import { getStaticItemHTML, StaticConfig } from '../ui/static/getStaticItemHtml'
import { AuthManager } from './AuthManager'
import { state } from './state'
import { logger as ExpressLogger } from 'express-winston'

const logger = getLogger('server')

const app = express()
const server = http.createServer(app)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false
      return compression.filter(req, res)
    },
  })
)
app.use(bodyParser.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(
  ExpressLogger({
    winstonInstance: logger,
    level: 'debug',
    msg: 'HTTP {{req.method}} {{res.statusCode}} {{res.responseTime}}ms {{req.url}} from {{req.ip}}',
  })
)

const requireAuth: express.RequestHandler = (req, res, next) => {
  if (!req.cookies.token) {
    throw new LoginRequiredError('Login is required for this request.')
  } else if (!AuthManager.isTokenValid(req.cookies.token)) {
    throw new InvalidTokenError('Login token is invalid, please logout and login again.')
  }
  next()
}

const ok = (data?: any) => ({ code: 0, data: data })

const serve = function serve(host: string, port: number, rootFolder: string) {
  // serve built-in assets
  app.use('/kiwi/', express.static(resolve(__dirname, '../kiwi')))

  // front-end
  app.use('/', express.static(resolve(__dirname, '../browser')))

  const useTmpFileUpload = false
  app.use(
    fileUpload({
      // TODO: no suitable tmp folder now, enable this when problem solved
      // useTempFiles: true
      // tempFileDir: '???'
    })
  )

  app.post('/login', async (req, res) => {
    const result = AuthManager.login(req.body.name, req.body.password)
    res.json(ok(result))
  })

  app.post('/get-item', async (req, res) => {
    const uri: string = req.body.uri
    logger.debug(`get item: ${uri}`)
    const it = await ItemManager.getItem(uri, req.cookies.token)
    res.json(ok(await toClientItem(uri, it)))
  })

  app.post('/put-item', requireAuth, async (req, res) => {
    const uri = req.body.uri
    const it = req.body.item
    const newItem = await ItemManager.putItem(uri, it, req.cookies.token)
    res.json(ok(await toClientItem(uri, newItem)))
  })

  app.post('/put-binary-item', requireAuth, async (req, res) => {
    const uri = req.body.uri
    const it: ServerItem = JSON.parse(req.body.item)
    if (!req.files) throw new UploadFileError('No file uploaded')
    if (Array.isArray(req.files.fn)) throw new UploadFileError('Too many files uploaded')
    const file = req.files.fn
    if (!it.type) it.type = file.mimetype as MIME
    if (useTmpFileUpload) {
      it.getContentStream = () => fs.createReadStream(file.tempFilePath)
      it.contentFilePath = file.tempFilePath
    } else {
      it.getContentStream = () => Readable.from(file.data)
    }
    const newItem = await ItemManager.putItem(uri, it, req.cookies.token)
    res.json(ok(await toClientItem(uri, newItem)))
  })

  app.post('/delete-item', requireAuth, async (req, res) => {
    const uri = req.body.uri
    await ItemManager.deleteItem(uri, req.cookies.token)
    res.json(ok())
  })

  app.post('/get-system-items', async (req, res) => {
    const items = await ItemManager.getSystemItems()
    res.json(ok(items))
  })

  app.post('/get-skinny-items', async (req, res) => {
    const items = await ItemManager.getSkinnyItems(req.cookies.token)
    const result: Record<string, Partial<ClientItem>> = {}
    for (const [uri, item] of Object.entries(items)) {
      result[uri] = { ...item, state: 'bare' }
    }
    res.json(ok(result))
  })

  app.post('/get-main-config', async (req, res) => {
    res.json(ok(state.mainConfig))
  })

  app.post('/get-search-result', async (req, res) => {
    logger.info(`search request ${req.body.input} got`)
    res.json(ok(await ItemManager.getSearchResult(req.body.input, req.cookies.token)))
  })

  app.get(/^\/raw\/(.+)/, async (req, res) => {
    const uri = decodeURIComponent(trimString(req.params[0].trim(), '/'))
    logger.debug(`get raw content of ${uri}`)
    const it = await ItemManager.getItem(uri, req.cookies.token)
    if (!isBinaryType(it.type)) {
      // svg is the only served non-binary item
      res.contentType(it.type).send(it.content)
      return
    }
    if (it.contentFilePath) {
      // have a file? send it
      res.sendFile(it.contentFilePath)
      return
    }
    // no file, can only pipe the stream now, maybe slow, and no positioning supported (cumbersome)
    res.set('Content-Type', it.type)
    it.getContentStream!().pipe(res)
  })

  app.get(/^\/static\/(.+)/, async (req, res) => {
    const uri = decodeURIComponent(trimString(req.params[0].trim(), '/'))
    logger.debug(`get static: ${uri}`)
    let it: ServerItem | null = null
    try {
      it = await ItemManager.getItem(uri, req.cookies.token)
    } catch (err) {
      if (err instanceof ItemNotExistsError) {
        res.status(404).send('Item Not Exists')
      } else if (err instanceof NoReadPermissionError) {
        res.status(403).send('No Read Permission')
      }
    }
    if (!it) return
    const paths = await Promise.all(
      uriCumSum(uri).map(async prefix => {
        const pUri = `/static/${prefix}`
        try {
          const pItem = await ItemManager.getItem(prefix, req.cookies.token)
          return {
            uri: pUri,
            title: pItem.title,
          }
        } catch {
          return {
            uri: pUri,
            title: prefix.split('/').pop()!,
          }
        }
      })
    )
    const config: StaticConfig = {
      paths: (uri !== 'index' ? [{ uri: '/static/index', title: 'Index' }] : []).concat(...paths),
    }
    res.send(getStaticItemHTML(uri, await toClientItem(uri, it), config))
  })

  const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof KiwiError) {
      res.status(200).json({
        code: err.code || -1,
        message: err.message,
        stack: err.stack,
      })
      logger.debug(`error response: code: ${err.code}, message: ${err.message}`)
    }
  }
  app.use(errorHandler)

  server.listen(port, host, () => logger.info(`Server running on port ${port}`))
}

export { app, serve }
