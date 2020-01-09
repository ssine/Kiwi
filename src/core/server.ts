/**
 * The server 
 * @packageDocumentation
 */
import { uri_item_map } from './uri'
import * as express from 'express'
import * as body_parser from 'body-parser'
import { get_logger } from './log'
import { manager } from './item_manager'

const logger = get_logger('server')

const app = express()
const port = 3000
app.use(body_parser.json())

export function serve(main: string) {
  console.log('main: ', main)
  app.use('/\\$kiwi/', express.static(manager.system_path))
  logger.info(`serving static folder ${manager.system_path}`)
  app.post('/get_item', (req, res) => {
    let uri: string = req.body.uri
    res.send(manager.get_item(uri).json())
  })

  app.get('/', (req, res) => {
    res.send(main)
  })

  app.listen(port, _ => console.log(`app listening on port ${port}`))
}
