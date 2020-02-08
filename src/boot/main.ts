#!/usr/bin/env node
import * as yargs from 'yargs'
import manager from '../core/ItemManager'
import { serve } from '../core/server'
import { initLogger } from '../core/Log'
import MarkdownParser from '../core/MarkdownParser'
import WikitextParser from '../core/WikitextParser'
import AsciidocParser from '../core/AsciidocParser'
import MediaParser from '../core/MediaParser'

import GraphvizPlugin from '../core/GraphvizPlugin'

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

const hwp = new GraphvizPlugin()
hwp.init()
hwp.register()

async function run () {
  await manager.loadItems(args.folder)
  if (args._[0] === 'serve') {
    serve(args.port)
  }
}

run()
