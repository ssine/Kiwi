/**
 * The server 
 * @packageDocumentation
 */
import * as http from 'http'
import * as express from 'express'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import { getLogger } from './Log'
import manager from './ItemManager'
import { resolve } from 'path'
import { trimString } from './Common'

const logger = getLogger('server')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)
app.use(bodyParser.json())
app.use(cookieParser())

const itemRouteTable: Record<string, express.Handler> = {}

const serve = function serve(port: number) {
  app.use('/kiwi/', express.static(resolve(__dirname, '../kiwi')))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.post('/get-item', async (req, res) => {
    let uri: string = req.body.uri
    const it = manager.getItem(uri)
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
    if (! manager.getUserManager().isTokenValid(req.cookies.token)) {
      res.send(await manager.getItem(req.body.uri)?.json())
    }
    let uri = req.body.uri
    let it = req.body.item
    res.send(await (await manager.saveItem(uri, it)).json())
  })

  app.post('/delete-item', async (req, res) => {
    if (! manager.getUserManager().isTokenValid(req.cookies.token)) return
    let uri = req.body.uri
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
      res.status(404).send(`not found uri ${uri}`)
    }
  })

  server.listen(port, () => logger.info(`Server set up on port ${port}`))
}

export {
  app,
  io,
  serve,
  itemRouteTable,
}
