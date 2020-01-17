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
const port = 3000
app.use(bodyParser.json())

const serve = function serve() {
  // also serve system items as static file, not used for now
  // app.use('/\\$kiwi/', express.static(manager.system_path))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.post('/get-item', (req, res) => {
    let uri: string = req.body.uri
    res.send(manager.getItem(uri).json())
  })

  app.post('/put-item', async (req, res) => {
    let it = req.body.item
    res.send((await manager.putItem(it)).json())
  })

  app.post('/get-system-items', (req, res) => {
    res.send(JSON.stringify(manager.getSystemItems()))
  })

  app.listen(port, _ => logger.info(`Server set up on port ${port}`))
}

export default serve
