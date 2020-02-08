#!/usr/bin/env node
import * as yargs from 'yargs'
import manager from '../core/ItemManager'
import { serve } from '../core/server'
import { initLogger } from '../core/Log'
import MarkdownParser from '../lib/parser/MarkdownParser'
import WikitextParser from '../lib/parser/WikitextParser'
import AsciidocParser from '../lib/parser/AsciidocParser'
import MediaParser from '../lib/parser/MediaParser'
import HighlightParser from '../lib/parser/HighlightParser'

import GraphvizPlugin from '../lib/plugin/GraphvizPlugin'
import TranscludePlugin from '../lib/plugin/TranscludePlugin'

const args = yargs
  .command('serve [folder]', 'serve wiki files in a folder', (yargs) => {
    yargs.option('port', {
      alias: 'p',
      describe: 'local port to listen on',
      default: 3000
    })
  })
  .option('log', {
    alias: 'l',
    describe: 'log level, possible levels: trace, debug, info, warn, severe',
    default: 'debug'
  })
  .demandCommand()
  .help()
  .argv as any


initLogger(args.log)

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

async function run () {
  await manager.loadItems(args.folder)
  if (args._[0] === 'serve') {
    serve(args.port)
  }
}

run()
