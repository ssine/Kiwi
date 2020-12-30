import { mathjax } from 'mathjax-full/js/mathjax'
import { TeX } from 'mathjax-full/js/input/tex'
import { SVG } from 'mathjax-full/js/output/svg'
import { jsdomAdaptor } from 'mathjax-full/js/adaptors/jsdomAdaptor'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages'
import { JSDOM } from 'jsdom'

const adaptor = jsdomAdaptor(JSDOM)

RegisterHTMLHandler(adaptor)

const tex = new TeX({
  packages: AllPackages,
  inlineMath: [
    ['$', '$']
  ],
  displayMath: [
    ['$$', '$$'],
    ['\\[', '\\]']
  ],
})
const svg = new SVG({ fontCache: 'local' })

function typesetDocumentMath(raw: string) {
  const html = mathjax.document(raw, { InputJax: tex, OutputJax: svg })
  html.findMath().compile().getMetrics().typeset().updateDocument()
  return html.document.body.innerHTML
}

export {
  typesetDocumentMath
}
