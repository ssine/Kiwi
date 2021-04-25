import React from 'react'
import ReactDOM from 'react-dom'
import anime from 'animejs/lib/anime.es'
import './Callout.css'

type CalloutProperty = {
  target: React.RefObject<HTMLElement>
  direction: AttachDirection
  onDismiss?: (ev?: any) => void
  style?: React.CSSProperties
}

enum AttachDirection {
  bottomLeftEdge,
  bottomRightEdge,
  topLeftEdge,
  topRightEdge,
}

class Callout extends React.Component<CalloutProperty, { direction: AttachDirection }> {
  layer: HTMLDivElement
  el: React.RefObject<HTMLDivElement>
  scrollCallback: (ev: Event) => void
  clickCallback: (ev: MouseEvent) => void

  constructor(props: CalloutProperty) {
    super(props)
    this.el = React.createRef()
    this.layer = document.createElement('div')
    this.layer.className = 'kiwi-callout-layer'

    this.state = {
      direction: this.props.direction,
    }
    this.scrollCallback = (ev: Event) => {
      this.props.onDismiss(ev)
    }
    this.clickCallback = (ev: MouseEvent) => {
      const targetRect = this.props.target.current.getBoundingClientRect()
      if (
        !(
          targetRect.left < ev.clientX &&
          ev.clientX < targetRect.left + targetRect.width &&
          targetRect.top < ev.clientY &&
          ev.clientY < targetRect.top + targetRect.height
        )
      ) {
        this.props.onDismiss(ev)
      }
    }
  }

  componentDidMount() {
    document.body.appendChild(this.layer)
    let animationDirection =
      this.state.direction === AttachDirection.bottomLeftEdge ||
      this.state.direction === AttachDirection.bottomRightEdge
        ? 'bottom'
        : 'top'
    if (this.el.current.offsetHeight < this.el.current.scrollHeight) {
      const boundingRect = this.props.target.current.getBoundingClientRect()
      const upperHeight = boundingRect.top
      const lowerHeight = window.innerHeight - boundingRect.bottom
      if (this.state.direction === AttachDirection.topLeftEdge && upperHeight < lowerHeight) {
        this.setState({ direction: AttachDirection.bottomLeftEdge })
        animationDirection = 'bottom'
      }
      if (this.state.direction === AttachDirection.topRightEdge && upperHeight < lowerHeight) {
        this.setState({ direction: AttachDirection.bottomRightEdge })
        animationDirection = 'bottom'
      }
      if (this.state.direction === AttachDirection.bottomLeftEdge && upperHeight > lowerHeight) {
        this.setState({ direction: AttachDirection.topLeftEdge })
        animationDirection = 'top'
      }
      if (this.state.direction === AttachDirection.bottomRightEdge && upperHeight > lowerHeight) {
        this.setState({ direction: AttachDirection.topRightEdge })
        animationDirection = 'top'
      }
    }
    if (this.props.onDismiss) {
      window.addEventListener('scroll', this.scrollCallback)
      window.addEventListener('click', this.clickCallback)
    }
    if (animationDirection === 'bottom') {
      anime({
        targets: this.el.current,
        translateY: -10,
        opacity: 0,
        duration: 150,
        direction: 'reverse',
        easing: 'easeInCubic',
      })
    } else {
      anime({
        targets: this.el.current,
        translateY: 10,
        opacity: 0,
        duration: 150,
        direction: 'reverse',
        easing: 'easeInCubic',
      })
    }
  }

  componentWillUnmount() {
    document.body.removeChild(this.layer)
    window.removeEventListener('scroll', this.scrollCallback)
    window.removeEventListener('click', this.clickCallback)
  }

  render() {
    const style = Object.assign({}, this._calculatePosition(), this.props.style)
    return ReactDOM.createPortal(
      <div className="kiwi-callout" style={style} ref={this.el}>
        {this.props.children}
      </div>,
      this.layer
    )
  }

  _calculatePosition(): Partial<React.CSSProperties> {
    let res: React.CSSProperties = {}
    const boundingRect = this.props.target.current.getBoundingClientRect()
    switch (this.state.direction) {
      case AttachDirection.bottomLeftEdge:
        res = {
          top: boundingRect.bottom,
          left: boundingRect.left,
          maxHeight: window.innerHeight - boundingRect.bottom,
        }
        break
      case AttachDirection.bottomRightEdge:
        res = {
          top: boundingRect.bottom,
          right: window.innerWidth - boundingRect.right,
          maxHeight: window.innerHeight - boundingRect.bottom,
        }
        break
      case AttachDirection.topLeftEdge:
        res = {
          bottom: window.innerHeight - boundingRect.top,
          left: boundingRect.left,
          maxHeight: window.innerHeight - (window.innerHeight - boundingRect.top),
        }
        break
      case AttachDirection.topRightEdge:
        res = {
          bottom: window.innerHeight - boundingRect.top,
          right: window.innerWidth - boundingRect.right,
          maxHeight: window.innerHeight - (window.innerHeight - boundingRect.top),
        }
        break
    }
    return res
  }
}

export { Callout, AttachDirection }
