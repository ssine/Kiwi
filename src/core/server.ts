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
import {getLogger} from './Log'
import manager from './ItemManager'
import {resolve} from 'path'
import {trimString, fixedEncodeURIComponent} from './Common'
import * as fs from 'fs'
import {promisify} from 'util'
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
app.use(bodyParser.json({limit: '1mb'}))
app.use(cookieParser())

const itemRouteTable: Record<string, express.Handler> = {}

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
    const it = manager.getItem(uri, req.cookies.token, true)
    if (it) res.send(await it.json())
    else res.status(404).send('Item not found!')
  })

  app.post('/login', async (req, res) => {
    req.body.name
    const result = manager.getUserManager().login(req.body.name, req.body.password)
    res.send(result)
  })

  /**
   * Save an item back
   * uri: original uri
   * item: the item to save
   */
  app.post('/save-item', async (req, res) => {
    if (!manager.getUserManager().isTokenValid(req.cookies.token)) {
      res.send(await manager.getItem(req.body.uri)?.json())
      return
    }
    const uri = req.body.uri
    const it = req.body.item
    res.send(await (await manager.saveItem(uri, it)).json())
  })

  app.post('/fileupload', async (req, res) => {
    const filePath = resolve(rootFolder, trimString(req.body.path, '/'))
    const folder = resolve(filePath, '..')
    if (!(await exists(folder))) {
      await fs.promises.mkdir(folder, {recursive: true})
    }
    // @ts-ignore
    req.files.fn.mv(filePath)
    res.send({})
  })

  app.post('/delete-item', async (req, res) => {
    if (!manager.getUserManager().isTokenValid(req.cookies.token)) {
      res.send({status: false})
      return
    }
    const uri = req.body.uri
    manager.deleteItem(uri)
    res.send({status: true})
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

  app.use((req, res, next) => {
    const uri = trimString(req.originalUrl.trim(), '/')
    if (uri in itemRouteTable) {
      itemRouteTable[uri](req, res, next)
    } else {
      const encoded = fixedEncodeURIComponent(decodeURIComponent(uri))
      if (encoded in itemRouteTable) {
        itemRouteTable[encoded](req, res, next)
      } else {
        res.status(404).send(`not found uri ${uri} or the encoded ${encoded}`)
      }
    }
  })

  server.listen(port, () => logger.info(`Server running on port ${port}`))
}

export {app, io, serve, itemRouteTable}
