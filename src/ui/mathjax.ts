let html: any
let inited = false

async function init() {
  if (inited) return

  // @ts-ignore
  const { ContextMenu } = await import(/* webpackChunkName: "mjx.contextMenu" */ 'mj-context-menu/dist/context_menu.js')

  const { mathjax } = await import(/* webpackChunkName: "mathjax" */ 'mathjax-full/js/mathjax')
  const { TeX } = await import(/* webpackChunkName: "mjx.tex" */ 'mathjax-full/js/input/tex')
  const { SVG } = await import(/* webpackChunkName: "mjx.svg" */ 'mathjax-full/js/output/svg')
  const { browserAdaptor } = await import(/* webpackChunkName: "mjx.browserAdaptor" */ 'mathjax-full/js/adaptors/browserAdaptor')
  const { RegisterHTMLHandler } = await import(/* webpackChunkName: "mjx.html" */ 'mathjax-full/js/handlers/html')
  const { AllPackages } = await import(/* webpackChunkName: "mjx.AllPackages" */ 'mathjax-full/js/input/tex/AllPackages')
  const { MenuHandler } = await import(/* webpackChunkName: "mjx.menu" */ 'mathjax-full/js/ui/menu/MenuHandler')
  const { Menu } = await import(/* webpackChunkName: "mjx.menu" */ 'mathjax-full/js/ui/menu/Menu')
  
  // @ts-ignore
  window.MathJax = {_: {}}
  
  // This is to fix the Explorer => Activate issue
  // @ts-ignore
  Menu.prototype.checkLoadableItems = function () {
    const menu = this.menu;
    for (const name of Object.keys(this.jax)) {
      if (!this.jax[name]) {
        menu.findID('Settings', 'Renderer', name).disable();
      }
    }
    menu.findID('Accessibility', 'Activate').disable();
    menu.findID('Accessibility', 'AutoCollapse').disable();
    menu.findID('Accessibility', 'Collapsible').disable();
  };

  const adapter = browserAdaptor()
  MenuHandler(RegisterHTMLHandler(adapter))

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
  html.reset()
  html.render()
}

export {
  typesetMath
}
