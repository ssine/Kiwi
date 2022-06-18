#!/usr/bin/env node
import * as yargs from 'yargs'
import * as path from 'path'
import { initLogger } from '../core/Log'

const args = yargs
  .command('serve [folder]', 'serve wiki files in a folder', yargs => {
    yargs
      .option('host', {
        alias: 'h',
        describe: 'host name to listen on',
        default: '0.0.0.0',
      })
      .option('port', {
        alias: 'p',
        describe: 'local port to listen on',
        default: 8000,
      })
      .option('use-poll', {
        describe: 'use polling on listening for fs events, more robust but inefficient',
        default: false,
      })
  })
  .command('migrate [from] [to]', 'migrate from tw folder')
  .option('log', {
    alias: 'l',
    describe: 'log level, possible levels: trace, debug, info, warn, severe',
    default: 'info',
  })
  .demandCommand()
  .help().argv as any

initLogger(args.log)

import { ItemManager } from '../core/ItemManager'
import { serve } from '../core/server'
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
import { FilesystemStorage } from '../lib/storage/FilesystemStorage'
import { AuthManager } from '../core/AuthManager'
import { renderItem } from '../core/render'
import PlaintextParser from '../lib/parser/PlaintextParser'
import { migrateTiddlyWiki } from './migrateTiddlyWiki'

function registLib() {
  const md = new MarkdownParser()
  md.init()
  md.register()
  const pt = new PlaintextParser()
  pt.init()
  pt.register()
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
    // require('../core/FileSynchronizer').options.usePolling = args.usePoll
    const storage = new FilesystemStorage(args.folder)
    const systemStorage = new FilesystemStorage(path.resolve(__dirname, '../kiwi'), 'kiwi/')
    const auth = new AuthManager()
    const manager = ItemManager.getInstance()
    await manager.init(storage, systemStorage, auth, renderItem)
    serve(args.host, args.port, args.folder)
  } else if (args._[0] === 'migrate') {
    await migrateTiddlyWiki(args.from, args.to)
  }
}

run()
