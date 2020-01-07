import { uri_item_map } from './uri'
import * as express from 'express'

const app = express()
const port = 3000

export function serve(map: uri_item_map) {
  for (let uri in map) {
    app.get(uri, (req, res) => {
      res.send(map[uri].parsed_content)
    })
  }
  app.listen(port, _ => console.log(`app listening on port ${port}`))
}
