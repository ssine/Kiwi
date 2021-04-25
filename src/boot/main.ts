#!/usr/bin/env node
import * as yargs from 'yargs'
import {initLogger} from '../core/Log'

const args = yargs
  .command('serve [folder]', 'serve wiki files in a folder', yargs => {
    yargs
      .option('port', {
        alias: 'p',
        describe: 'local port to listen on',
        default: 3000,
      })
      .option('use-poll', {
        describe: 'use polling on listening for fs events, more robust but inefficient',
        default: false,
      })
  })
  .option('log', {
    alias: 'l',
    describe: 'log level, possible levels: trace, debug, info, warn, severe',
    default: 'info',
  })
  .demandCommand()
  .help().argv as any

initLogger(args.log)

import manager from '../core/ItemManager'
import {serve} from '../core/server'
import MarkdownParser from '../lib/parser/MarkdownParser'
import WikitextParser from '../lib/parser/WikitextParser'
import AsciidocParser from '../lib/parser/AsciidocParser'
import MediaParser from '../lib/parser/MediaParser'
import HighlightParser from '../lib/parser/HighlightParser'

import GraphvizPlugin from '../lib/plugin/GraphvizPlugin'
import TranscludePlugin from '../lib/plugin/TranscludePlugin'
import ListPlugin from '../lib/plugin/ListPlugin'
import SVGPlugin from '../lib/plugin/SVGPlugin'
import CSSEscapePlugin from '../lib/plugin/CSSEscapePlugin'

function registLib() {
  const md = new MarkdownParser()
  md.init()
  md.register()
  const wt = new WikitextParser()
  wt.init()
  wt.register()
  const adoc = new AsciidocParser()
  adoc.init()
  adoc.register()
  const mid = new MediaParser()
  mid.init()
  mid.register()
  const hl = new HighlightParser()
  hl.init()
  hl.register()

  const gviz = new GraphvizPlugin()
  gviz.init()
  gviz.register()
  const trans = new TranscludePlugin()
  trans.init()
  trans.register()
  const ls = new ListPlugin()
  ls.init()
  ls.register()
  const svg = new SVGPlugin()
  svg.init()
  svg.register()
  const cssesc = new CSSEscapePlugin()
  cssesc.init()
  cssesc.register()
}

async function run() {
  registLib()
  if (args._[0] === 'serve') {
    require('../core/FileSynchronizer').options.usePolling = args.usePoll
    await manager.loadItems(args.folder)
    serve(args.port, args.folder)
  }
}

run()
