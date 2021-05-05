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
import { resolve } from 'path'
import { trimString, fixedEncodeURIComponent } from './Common'
import * as fs from 'fs'
import { promisify } from 'util'
import { ItemManager } from './ItemManager'
import { renderItem } from './ServerItem'
import { ItemNotExistsError } from './Error'
import { isBinaryType } from './MimeType'
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
app.use(bodyParser.json({ limit: '1mb' }))
app.use(cookieParser())

const itemRouteTable: Record<string, express.Handler> = {}

const manager = ItemManager.getInstance()

const ok = (data?: any) => ({ code: 0, data: data })

const serve = function serve(port: number, rootFolder: string) {
  app.use('/kiwi/', express.static(resolve(__dirname, '../kiwi')))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.use(
    fileUpload({
      // useTempFiles: true
    })
  )

  app.post('/get-item', async (req, res) => {
    const uri: string = req.body.uri
    const it = await manager.getItem(uri, req.cookies.token)
    if (!it.renderSync) await renderItem(uri, it)
    res.json(ok(it))
  })

  app.post('/login', async (req, res) => {
    const result = manager.auth.login(req.body.name, req.body.password)
    res.json(ok(result))
  })

  /**
   * Save an item back
   * uri: original uri
   * item: the item to save
   */
  app.post('/put-item', async (req, res) => {
    const uri = req.body.uri
    const it = req.body.item
    await manager.putItem(uri, it, req.cookies.token)
    res.json(ok())
  })

  app.post('/put-binary-item', async (req, res) => {
    const uri = req.body.uri
    const it = req.body.item
    await manager.putItem(uri, it, req.cookies.token)
    res.json(ok())
  })

  app.post('/fileupload', async (req, res) => {
    const filePath = resolve(rootFolder, trimString(req.body.path, '/'))
    const folder = resolve(filePath, '..')
    if (!(await exists(folder))) {
      await fs.promises.mkdir(folder, { recursive: true })
    }
    // @ts-ignore
    req.files.fn.mv(filePath)
    res.send({})
  })

  app.post('/delete-item', async (req, res) => {
    const uri = req.body.uri
    manager.deleteItem(uri, req.cookies.token)
    res.json(ok())
  })

  app.post('/get-system-items', (req, res) => {
    res.send(JSON.stringify(manager.getSystemItems()))
  })

  app.post('/get-skinny-items', (req, res) => {
    res.send(JSON.stringify(manager.getSkinnyItems()))
  })

  app.post('/get-search-result', (req, res) => {
    logger.info(`search request ${req.body.input} got`)
    res.send(JSON.stringify(manager.getSearchResult(req.body.input)))
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
    res.status(500).json({
      code: err.code || -1,
      message: err.message,
    })
  }
  app.use(errorHandler)

  server.listen(port, () => logger.info(`Server running on port ${port}`))
}

export { app, io, serve, itemRouteTable }
