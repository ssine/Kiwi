/**
 * This part runs in browser
 * @packageDocumentation
 */

import $ from 'jquery'
import { client_item as item } from './item'
import sqrl from 'squirrelly'

sqrl.autoEscaping(false)

async function init() {
  let all = document.querySelectorAll(".item-link")
  for (let el of all) {
    let e = el as HTMLElement
    e.onclick = async evt => {
      evt.cancelBubble = true;
      evt.stopPropagation();
      evt.preventDefault();
      console.log(evt, 'clicked!')
      let it = new item()
      it.uri = e.getAttribute('href')
      await it.load()
      let tmpl = new item()
      tmpl.uri = 'item.sqrl'
      await tmpl.load()
      let new_el = sqrl.Render(tmpl.content, {
        title: it.title,
        content: it.html()
      })
      console.log(it)
      $('.item-flow').append(new_el)
      return false;
    }
  }
}

const template = `
<div>{{title}}</div>
`

console.log(sqrl.Render(template, {
  title: 'Nothing more'
}))

async function run() {
  await init()
}

window.onload = run
