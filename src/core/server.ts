/**
 * The server
 * @packageDocumentation
 */
import * as http from 'http'
import * as express from 'express'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as fileUpload from 'express-fileupload'
import * as compression from 'compression'
import { getLogger } from './Log'
import { MIME } from './MimeType'
import { resolve } from 'path'
import { trimString, fixedEncodeURIComponent } from './Common'
import * as fs from 'fs'
import { promisify } from 'util'
import { ItemManager } from './ItemManager'
import { renderItem, ServerItem } from './ServerItem'
import { UploadFileError } from './Error'
import { isBinaryType } from './MimeType'
import { Readable } from 'node:stream'
const exists = promisify(fs.exists)

const logger = getLogger('server')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)
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

const itemRouteTable: Record<string, express.Handler> = {}

const manager = ItemManager.getInstance()

const ok = (data?: any) => ({ code: 0, data: data })

const serve = function serve(port: number, rootFolder: string) {
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
    const result = manager.auth.login(req.body.name, req.body.password)
    res.json(ok(result))
  })

  app.post('/get-item', async (req, res) => {
    const uri: string = req.body.uri
    const it = await manager.getItem(uri, req.cookies.token)
    if (!it.renderSync) await renderItem(uri, it)
    res.json(ok(it))
  })

  app.post('/put-item', async (req, res) => {
    const uri = req.body.uri
    const it = req.body.item
    await manager.putItem(uri, it, req.cookies.token)
    res.json(ok())
  })

  app.post('/put-binary-item', async (req, res) => {
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
    await manager.putItem(uri, it, req.cookies.token)
    res.json(ok())
  })

  app.post('/delete-item', async (req, res) => {
    const uri = req.body.uri
    await manager.deleteItem(uri, req.cookies.token)
    res.json(ok())
  })

  app.post('/get-system-items', async (req, res) => {
    res.json(ok(await manager.getSystemItems()))
  })

  app.post('/get-skinny-items', async (req, res) => {
    res.json(ok(await manager.getSkinnyItems()))
  })

  app.post('/get-search-result', async (req, res) => {
    logger.info(`search request ${req.body.input} got`)
    res.json(ok(JSON.stringify(await manager.getSearchResult(req.body.input))))
  })

  app.use(async (req, res, next) => {
    const uri = decodeURIComponent(trimString(req.originalUrl.trim(), '/'))
    const it = await manager.getItem(uri, req.cookies.token)
    if (!isBinaryType(it.type)) {
      // only binary items get served
      res.status(404).send(`uri ${uri} not found`)
      return
    }
    if (it.contentFilePath) {
      // have a file? send it
      res.sendFile(it.contentFilePath)
      return
    }
    // no file, can only pipe the stream now, maybe slow, and no positioning supported (maybe later)
    res.set('Content-Type', it.type)
    it.getContentStream!().pipe(res)
  })

  const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
    logger.error(`error response: code=${err.code}, message=${err.message}`)
    res.status(200).json({
      code: err.code || -1,
      message: err.message,
    })
  }
  app.use(errorHandler)

  server.listen(port, () => logger.info(`Server running on port ${port}`))
}

export { app, io, serve, itemRouteTable }
