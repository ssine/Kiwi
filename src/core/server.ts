/**
 * The server 
 * @packageDocumentation
 */
import * as http from 'http'
import * as express from 'express'
import * as socketIO from 'socket.io'
import * as bodyParser from 'body-parser'
import { getLogger } from './Log'
import manager from './ItemManager'
import { resolve } from 'path'

const logger = getLogger('server')

export const app = express()
const server = http.createServer(app)
export const io = socketIO(server)
app.use(bodyParser.json())

export const serve = function serve(port: number) {
  app.use('/kiwi/', express.static(resolve(__dirname, '../kiwi')))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.post('/get-item', async (req, res) => {
    let uri: string = req.body.uri
    const it = manager.getItem(uri)
    if (it) res.send(await it.json())
    else res.status(404).send('Item not found!')
  })

  app.post('/put-item', async (req, res) => {
    let it = req.body.item
    res.send(await (await manager.putItem(it)).json())
  })

  /**
   * Save an item back
   * uri: original uri
   * item: the item to save
   */
  app.post('/save-item', async (req, res) => {
    let uri = req.body.uri
    let it = req.body.item
    res.send(await (await manager.saveItem(uri, it)).json())
  })

  app.post('/delete-item', async (req, res) => {
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

  server.listen(port, () => logger.info(`Server set up on port ${port}`))
}
