import $ from 'jquery'
import { client_item as item } from './item'
import runtime from 'pug-runtime'

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
      let new_el = document.createElement('div')
      new_el.innerHTML = it.html()
      console.log(it)
      $('.item-flow').append(new_el)
      return false;
    }
  }
}

async function run() {
  await init()
}

window.onload = run
