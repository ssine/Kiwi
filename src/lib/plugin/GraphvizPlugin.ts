import { RenderPlugin } from '../../core/Plugin'
const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');

export default class GraphvizPlugin extends RenderPlugin {
  viz: any
  init() {
    this.viz = new Viz({ Module, render });
  }
  getName() {
    return 'graphviz'
  }
  getFunction() {
    return async (input: string): Promise<string> => {
      return new Promise((res, rej) => {
        this.viz.renderString(input)
          .then((v: string) => res(`<div>${v}</div>`))
          .catch((err:string) => {
            this.viz = new Viz({ Module, render });
            res(err)
          })
      })
    }
  }
}
