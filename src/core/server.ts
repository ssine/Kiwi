/**
 * The server 
 * @packageDocumentation
 */
import * as express from 'express'
import * as bodyParser from 'body-parser'
import { getLogger } from './Log'
import manager from './ItemManager'
import { resolve } from 'path'

const logger = getLogger('server')

const app = express()
app.use(bodyParser.json())

const serve = function serve(port: number) {
  app.use('/\\$kiwi/', express.static(resolve(__dirname, '../kiwi')))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.post('/get-item', (req, res) => {
    let uri: string = req.body.uri
    res.send(manager.getItem(uri).json())
  })

  app.post('/put-item', async (req, res) => {
    let it = req.body.item
    res.send((await manager.putItem(it)).json())
  })

  /**
   * Save an item back
   * uri: original uri
   * item: the item to save
   */
  app.post('/save-item', async (req, res) => {
    let uri = req.body.uri
    let it = req.body.item
    res.send((await manager.saveItem(uri, it)).json())
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

  app.listen(port, _ => logger.info(`Server set up on port ${port}`))
}

export default serve
