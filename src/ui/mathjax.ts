import { mathjax } from 'mathjax-full/js/mathjax'
import { TeX } from 'mathjax-full/js/input/tex'
import { SVG } from 'mathjax-full/js/output/svg'
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages'

const adapter = browserAdaptor()

RegisterHTMLHandler(adapter)

const html = mathjax.document(document, {
  InputJax: new TeX({
    packages: AllPackages,
    inlineMath: [              // start/end delimiter pairs for in-line math
      ['$', '$']
    ],
    displayMath: [             // start/end delimiter pairs for display math
      ['$$', '$$'],
      ['\\[', '\\]']
    ],
  }),
  OutputJax: new SVG({
    fontCache: 'none'
  })
})

function typesetMath() {
  html.processed.clear('findMath')
  html.processed.clear('compile')
  html.processed.clear('getMetrics')
  html.processed.clear('typeset')
  html.processed.clear('updateDocument')
  html.findMath()
  .compile()
  .getMetrics()
  .typeset()
  .updateDocument()
  console.log('typesetted!')
}

// @ts-ignore
window.typesetMath = typesetMath

export {
  // MathJax
  typesetMath,
  html
}
