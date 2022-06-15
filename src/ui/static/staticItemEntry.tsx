import React from 'react'
import ReactDOM from 'react-dom'
import { store } from '../store'
import { getItem } from '../api'
import { StaticItemPage } from './staticItemPage'
import { isLinkInternal, waitScriptLoad } from '../Common'
import { typesetMath } from '../mathjax'

const contentPostProcess = async () => {
  const contentEl = document.getElementById('static-item-root')!
  const links = contentEl.querySelectorAll('a')
  links.forEach((el: HTMLAnchorElement | SVGAElement) => {
    if (el instanceof SVGAElement) {
      if (el.href.baseVal.trim().startsWith('http')) {
        el.target.baseVal = '_blank'
      } else {
        el.onclick = async evt => {
          evt.cancelBubble = true
          evt.stopPropagation()
          evt.preventDefault()
          window.open(`/static/${el.href.baseVal}`)
          return false
        }
        el.classList.add('item-link')
      }
      return
    }
    if (isLinkInternal(el)) {
      const elUri = decodeURIComponent(el.getAttribute('href')!)
      el.onclick = async evt => {
        evt.cancelBubble = true
        evt.stopPropagation()
        evt.preventDefault()
        window.open(`/static/${elUri}`)
        console.log('new uri: ' + `/static/${elUri}`)
        return false
      }
      el.classList.add('item-link')
    } else {
      el.target = '_blank'
    }
  })

  // execute scripts
  const scripts = contentEl.getElementsByTagName('script')
  for (let idx = 0; idx < scripts.length; idx++) {
    const script = scripts.item(idx)
    if (!script) return
    const newScript = document.createElement('script')
    const scriptContent = document.createTextNode(script.text)
    newScript.appendChild(scriptContent)
    let onLoad: Promise<void> | null = null
    script.insertAdjacentElement('afterend', newScript)
    if (script.src !== '') {
      newScript.src = script.src
      newScript.async = true
      onLoad = waitScriptLoad(newScript)
    }
    script.remove()
    if (onLoad) await onLoad
  }

  if (contentEl.innerText.includes('$')) {
    typesetMath()
  }
}

const main = async () => {
  console.log(store.getState())
  const uri = window.location.pathname.slice(8)
  const item = await getItem(uri)
  await contentPostProcess()
  ReactDOM.hydrate(<StaticItemPage uri={uri} item={item} />, document.getElementById('static-item-root'))
}

main()
