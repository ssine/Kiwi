import $ from 'jquery'
import { load_item } from './common'

async function init() {
  let all = document.querySelectorAll(".item-link")
  for (let el of all) {
    let e = el as HTMLElement
    e.onclick = async evt => {
      evt.cancelBubble = true;
      evt.stopPropagation();
      evt.preventDefault();
      console.log(evt, 'clicked!')
      let content = await load_item(e.getAttribute('href'))
      let new_el = document.createElement('div')
      new_el.innerHTML = content
      $('.item-flow').append(new_el)
      return false;
    }
  }
}

async function run() {
  await init()
}

window.onload = run
