import React from 'react'
import { FontIcon } from 'office-ui-fabric-react/lib/Icon'
import anime from 'animejs/lib/anime.es'

export default class SidebarSwitch extends React.Component<{ container: HTMLElement }, {}> {
  constructor(props: { container: HTMLElement }) {
    super(props)
    let selfEl = props.container
    selfEl.onclick = () => {
      let el = document.getElementsByClassName('sidebar')[0] as HTMLElement
      if (el.style.display == 'none') {
        anime({
          targets: selfEl,
          rotateY: 0,
          duration: 200,
          easing: 'linear'
        })
        el.style.display = 'flex'
        anime({
          targets: el,
          opacity: 1,
          duration: 200,
          easing: 'linear'
        })
        anime({
          targets: el,
          translateX: 0,
          duration: 200,
          easing: 'easeOutQuart'
        })
      } else {
        anime({
          targets: selfEl,
          rotateY: 180,
          duration: 200,
          easing: 'linear'
        })
        anime({
          targets: el,
          translateX: - el.clientWidth,
          duration: 200,
          easing: 'easeInQuart'
        })
        anime({
          targets: el,
          opacity: 0,
          duration: 200,
          easing: 'linear',
          complete: () => { el.style.display = 'none' }
        })
      }
    }
  }

  render() {
    return <div>
      <FontIcon iconName="DoubleChevronLeft" />
    </div>
  }
}
