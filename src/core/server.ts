/**
 * The server 
 * @packageDocumentation
 */
import { uri_item_map } from './uri'
import * as express from 'express'
import * as body_parser from 'body-parser'
import { get_logger } from './log'

const logger = get_logger('server')

const app = express()
const port = 3000
app.use(body_parser.json())

export function serve(main: string, map: uri_item_map, root: string) {
  console.log('main: ', main)
  app.use('/\\$kiwi/', express.static(root))
  logger.info(`serving static folder ${root}`)
  app.post('/get_item', (req, res) => {
    let uri: string = req.body.uri
    res.send(map[uri].json())
  })

  app.get('/', (req, res) => {
    res.send(main)
  })

  app.listen(port, _ => console.log(`app listening on port ${port}`))
}
