import React, { useEffect, useState } from 'react'
import anime from 'animejs/lib/anime.es'
import { FlowDisplayMode, getCookie, isMobile } from '../Common'
import { IconButton } from './basic/Button/IconButton'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'
import { pageConfigs } from '../../boot/config'
import { Pivot, PivotItem } from './basic/Pivot/Pivot'
import { IndexTree } from './IndexTree'
import { Banner } from './basic/Banner/Banner'
import LoginForm from './LoginForm'
import { SearchBar } from './SearchBar'
import { Slider } from './basic/Slider/Slider'
import { Select } from './basic/Select/Select'

const manager = ItemManager.getInstance()

export const Sidebar = (props: {
  displaiedUris: string[]
  displayMode: FlowDisplayMode
  setDisplayMode: (mode: FlowDisplayMode) => void
  itemWidth: number
  setItemWidth: (w: number) => void
  showSidebar: boolean
  setShowSidebar: (s: boolean) => void
  sidebarWidth: number
  setSidebarWidth: (w: number) => void
}) => {
  // TODO: update on title item changes
  const [title, setTitle] = useState(manager.getItem(pageConfigs.title).content.trim())
  const [subTitle, setSubTitle] = useState(manager.getItem(pageConfigs.subTitle).content.trim())
  const {
    displaiedUris,
    itemWidth,
    setItemWidth,
    sidebarWidth,
    setSidebarWidth,
    displayMode,
    setDisplayMode,
    showSidebar,
    setShowSidebar,
  } = props

  useEffect(() => {
    // hide sidebar if its initially hidden
    setTimeout(() => {
      if (!showSidebar) {
        const switchEl = document.getElementsByClassName('kiwi-sidebar-switch')[0] as HTMLElement
        const sidebarEl = document.getElementsByClassName('kiwi-sidebar')[0] as HTMLElement
        sidebarEl.style.display = 'none'
        switchEl.style.transform = 'rotateY(180)'
      }
    }, 0)
  }, [])

  return (
    <>
      <div
        className="kiwi-sidebar-switch"
        onClick={() => {
          onSwitchClick(setShowSidebar)
        }}
      >
        <a>
          <i className="ms-Icon ms-Icon--DoubleChevronLeft" />
        </a>
      </div>
      <div
        className="kiwi-sidebar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: sidebarWidth,
        }}
      >
        <h1 className="site-title" id="site-title">
          {title}
        </h1>
        <div className="site-subtitle" id="site-subtitle">
          {subTitle}
        </div>
        <div className="page-controls">
          {getCookie('token') !== '' ? (
            <>
              <IconButton
                iconName="Add"
                title="New Item"
                onClick={_ => {
                  eventBus.emit('create-item-clicked', {})
                }}
                styles={{
                  root: {
                    width: isMobile ? '10vw' : 30,
                    height: isMobile ? '10vw' : 30,
                    fontSize: isMobile ? '5vw' : 20,
                  },
                }}
              />
            </>
          ) : (
            <></>
          )}
        </div>
        <SearchBar />
        <Pivot
          styles={{
            panel: { flexGrow: 1, overflow: 'auto', marginTop: 5 },
            root: {
              marginTop: 10,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              flexGrow: 1,
            },
          }}
        >
          <PivotItem name="Open">
            {displaiedUris.map(uri => (
              <div
                className="kiwi-active-list-item"
                key={uri}
                onClick={_ => eventBus.emit('item-link-clicked', { targetURI: uri })}
              >
                {manager.getItem(uri).title}
              </div>
            ))}
          </PivotItem>
          <PivotItem name="Index">
            <IndexTree />
          </PivotItem>
          <PivotItem name="Action">
            <Banner text="Account" />
            <LoginForm />
            <Banner text="UI" />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Item Width</div>
            <Slider value={itemWidth} onChange={val => setItemWidth(parseInt(val))} range={[350, 1500]} />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Sidebar Width</div>
            <Slider value={sidebarWidth} onChange={val => setSidebarWidth(parseInt(val))} range={[200, 700]} />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Flow Type</div>
            <Select
              value={
                {
                  center: 'Center',
                  flow: 'Flow',
                }[displayMode]
              }
              style={{ height: 23 }}
              onSelect={val => setDisplayMode(val as FlowDisplayMode)}
            >
              <option value="center">Center</option>
              <option value="flow">Flow</option>
            </Select>
          </PivotItem>
        </Pivot>
      </div>
    </>
  )
}

const onSwitchClick = (setShowSidebar: (v: boolean) => void) => {
  const switchEl = document.getElementsByClassName('kiwi-sidebar-switch')[0] as HTMLElement
  const sidebarEl = document.getElementsByClassName('kiwi-sidebar')[0] as HTMLElement
  if (sidebarEl.style.display === 'none') {
    setShowSidebar(true)
    anime({
      targets: switchEl,
      rotateY: 0,
      duration: 200,
      easing: 'linear',
    })
    sidebarEl.style.display = 'flex'
    anime({
      targets: sidebarEl,
      opacity: 1,
      duration: 200,
      easing: 'linear',
    })
    anime({
      targets: sidebarEl,
      translateX: 0,
      duration: 200,
      easing: 'easeOutQuart',
    })
  } else {
    setShowSidebar(false)
    anime({
      targets: switchEl,
      rotateY: 180,
      duration: 200,
      easing: 'linear',
    })
    anime({
      targets: sidebarEl,
      translateX: -sidebarEl.clientWidth,
      duration: 200,
      easing: 'easeInQuart',
    })
    anime({
      targets: sidebarEl,
      opacity: 0,
      duration: 200,
      easing: 'linear',
      complete: () => {
        sidebarEl.style.display = 'none'
      },
    })
  }
}
