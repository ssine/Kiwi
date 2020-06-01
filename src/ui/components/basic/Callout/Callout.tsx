import React from 'react'
import ReactDOM from 'react-dom'
import anime from 'animejs/lib/anime.es'
import './Callout.css'

type CalloutProperty = {
  target: React.RefObject<HTMLElement>
  width: number
  direction: AttachDirection
  onDismiss?: (ev?: any) => void
  style?: React.CSSProperties
}

enum AttachDirection {
  bottomLeftEdge,
  bottomMiddleEdge
}

class Callout extends React.Component<CalloutProperty, {}> {
  layer: HTMLDivElement
  el: React.RefObject<HTMLDivElement>
  scrollCallback: (ev: Event) => void
  clickCallback: (ev: Event) => void

  constructor(props: CalloutProperty) {
    super(props)
    this.el = React.createRef()
    this.layer = document.createElement('div')
    this.layer.className = 'kiwi-callout-layer'

    this.scrollCallback = (ev: Event) => {
      this.props.onDismiss(ev)
    }
    this.clickCallback = (ev: MouseEvent) => {
      let targetRect = this.props.target.current.getBoundingClientRect()
      if (!(targetRect.left < ev.clientX && ev.clientX < targetRect.left + targetRect.width &&
        targetRect.top < ev.clientY && ev.clientY < targetRect.top + targetRect.height)) {
        this.props.onDismiss(ev)
      }
    }
  }

  componentDidMount() {
    document.body.appendChild(this.layer)
    if (this.props.onDismiss) {
      window.addEventListener('scroll', this.scrollCallback)
      window.addEventListener('click', this.clickCallback)
    }
    anime({
      targets: this.el.current,
      translateY: -10,
      opacity: 0,
      duration: 150,
      direction: 'reverse',
      easing: 'easeInCubic'
    })
  }

  componentWillUnmount() {
    document.body.removeChild(this.layer)
    window.removeEventListener('scroll', this.scrollCallback)
    window.removeEventListener('click', this.clickCallback)
  }

  render() {
    let boundingRect = this.props.target.current.getBoundingClientRect()
    let top = 0
    let left = 0
    switch (this.props.direction) {
      case AttachDirection.bottomLeftEdge:
        top = boundingRect.top + boundingRect.height
        left = boundingRect.left
        break
      case AttachDirection.bottomMiddleEdge:
        top = boundingRect.top + boundingRect.height
        left = boundingRect.left - (this.props.width - boundingRect.width) / 2
        break
    }
    let style = Object.assign({}, {
      width: this.props.width,
      top: top,
      left: left,
      maxHeight: window.innerHeight - top
    }, this.props.style)
    return ReactDOM.createPortal((
      <div
        className="kiwi-callout"
        style={style}
        ref={this.el}>
        {this.props.children}
      </div>
    ), this.layer)
  }
}

export { Callout, AttachDirection }
