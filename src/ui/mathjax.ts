let html: any
let inited = false

async function init() {
  if (inited) return

  const { mathjax } = await import(/* webpackChunkName: "mathjax" */ 'mathjax-full/js/mathjax')
  const { TeX } = await import(/* webpackChunkName: "mjx.tex" */ 'mathjax-full/js/input/tex')
  const { SVG } = await import(/* webpackChunkName: "mjx.svg" */ 'mathjax-full/js/output/svg')
  const { browserAdaptor } = await import(/* webpackChunkName: "mjx.browserAdaptor" */ 'mathjax-full/js/adaptors/browserAdaptor')
  const { RegisterHTMLHandler } = await import(/* webpackChunkName: "mjx.html" */ 'mathjax-full/js/handlers/html')
  const { AllPackages } = await import(/* webpackChunkName: "mjx.AllPackages" */ 'mathjax-full/js/input/tex/AllPackages')
  const adapter = browserAdaptor()

  RegisterHTMLHandler(adapter)

  html = mathjax.document(document, {
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
  inited = true
  return
}

async function typesetMath() {
  await init()
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

export {
  // MathJax
  typesetMath
}
