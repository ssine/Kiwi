import React from 'react'
import ReactDOM from 'react-dom'
import anime from 'animejs'
import './Callout.css'

type CalloutProperty = {
  visible: boolean
  direction: AttachDirection
  alignWidth?: boolean
  onDismiss?: (ev?: any) => void
  style?: React.CSSProperties
  wrapperStyle?: React.CSSProperties
  content?: React.ReactNode
}

enum AttachDirection {
  bottomLeftEdge,
  bottomRightEdge,
  topLeftEdge,
  topRightEdge,
}

/**
 * children: target to attach callout to
 * content: callout content
 */
class Callout extends React.Component<CalloutProperty, { direction: AttachDirection }> {
  layer: HTMLDivElement
  target: React.RefObject<HTMLDivElement>
  content: React.RefObject<HTMLDivElement>
  prevVisible: boolean
  scrollCallback: (ev: Event) => void
  clickCallback: (ev: MouseEvent) => void

  constructor(props: CalloutProperty) {
    super(props)
    this.content = React.createRef()
    this.target = React.createRef()
    this.layer = document.createElement('div')
    this.layer.className = 'kiwi-callout-layer'
    this.prevVisible = this.props.visible

    this.state = {
      direction: this.props.direction,
    }
    this.scrollCallback = (ev: Event) => {
      this.props.onDismiss(ev)
    }
    this.clickCallback = (ev: MouseEvent) => {
      const targetRect = this.target.current.getBoundingClientRect()
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
  }

  componentDidUpdate() {
    if (!this.prevVisible && this.props.visible) {
      let animationDirection =
        this.state.direction === AttachDirection.bottomLeftEdge ||
        this.state.direction === AttachDirection.bottomRightEdge
          ? 'bottom'
          : 'top'

      if (this.content.current.offsetHeight < this.content.current.scrollHeight) {
        const boundingRect = this.target.current.getBoundingClientRect()
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
          targets: this.content.current,
          translateY: -10,
          opacity: 0,
          duration: 150,
          direction: 'reverse',
          easing: 'easeInCubic',
        })
      } else {
        anime({
          targets: this.content.current,
          translateY: 10,
          opacity: 0,
          duration: 150,
          direction: 'reverse',
          easing: 'easeInCubic',
        })
      }
    }
    this.prevVisible = this.props.visible
  }

  componentWillUnmount() {
    document.body.removeChild(this.layer)
    window.removeEventListener('scroll', this.scrollCallback)
    window.removeEventListener('click', this.clickCallback)
  }

  render() {
    const style = Object.assign(
      {},
      this.target.current ? calculatePosition(this.target.current, this.state.direction) : {},
      this.props.alignWidth && this.target.current ? { width: this.target.current.clientWidth } : {},
      this.props.style
    )
    return (
      <>
        <div ref={this.target} style={this.props.wrapperStyle}>
          {this.props.children}
        </div>
        {this.props.visible &&
          ReactDOM.createPortal(
            <div className="kiwi-callout" style={style} ref={this.content}>
              {this.props.content}
            </div>,
            this.layer
          )}
      </>
    )
  }
}

const calculatePosition = (target: HTMLElement, direction: AttachDirection): Partial<React.CSSProperties> => {
  let res: React.CSSProperties = {}
  const boundingRect = target.getBoundingClientRect()
  switch (direction) {
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

export { Callout, AttachDirection }
