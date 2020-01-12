/**
 * The server 
 * @packageDocumentation
 */
import { uri_item_map } from './uri'
import * as express from 'express'
import * as body_parser from 'body-parser'
import { get_logger } from './log'
import { manager } from './item_manager'
import { resolve } from 'path'

const logger = get_logger('server')

const app = express()
const port = 3000
app.use(body_parser.json())

export function serve(main: string) {
  app.use('/\\$kiwi/', express.static(manager.system_path))

  app.use('/', express.static(resolve(__dirname, '../browser')))

  app.post('/get_item', (req, res) => {
    let uri: string = req.body.uri
    res.send(manager.get_item(uri).json())
  })

  app.post('/get_system_items', (req, res) => {
    res.send(JSON.stringify(manager.get_system_items()))
  })

  app.listen(port, _ => console.log(`app listening on port ${port}`))

}
