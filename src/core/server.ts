import { uri_item_map } from './uri'
import { item_render } from './ui'
import * as express from 'express'

const app = express()
const port = 3000

export function serve(main: string, map: uri_item_map) {
  for (let uri in map) {
    app.get(uri, (req, res) => {
      res.send(item_render({
        title: map[uri].headers.title,
        content: map[uri].render()
      }))
    })
  }
  app.get('/', (req, res) => {
    res.send(main)
  })
  app.use(express.static('build/ui'))
  app.listen(port, _ => console.log(`app listening on port ${port}`))
}
