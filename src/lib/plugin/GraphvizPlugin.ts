import { RenderPlugin } from '../../core/plugin'
const Viz = require('viz.js')
const { Module, render } = require('viz.js/full.render.js')
import * as cheerio from 'cheerio'

export default class GraphvizPlugin extends RenderPlugin {
  viz: any
  init() {
    this.viz = new Viz({ Module, render })
  }
  getNames() {
    return ['graphviz']
  }
  getFunctionForItem() {
    return async (input: string, config: any): Promise<string> => {
      return new Promise((res, rej) => {
        const cfg = config ? config : {}
        this.viz
          .renderString(input, cfg)
          .then((v: string) => {
            const doc = cheerio.load(v)
            doc('svg').first().removeAttr('height')
            res(`<div class="graphviz-diagram">${doc.xml()}</div>`)
          })
          .catch((err: string) => {
            this.viz = new Viz({ Module, render })
            res(err)
          })
      })
    }
  }
}
