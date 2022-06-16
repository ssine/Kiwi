import React from 'react'
import { FlowDisplayMode, getCookie, isMobile } from '../../Common'
import { IconButton } from '../../components/basic/Button/IconButton'
import { Pivot, PivotItem } from '../../components/basic/Pivot/Pivot'
import { Banner } from '../../components/basic/Banner/Banner'
import LoginForm from '../../components/LoginForm'
import { SearchBar } from '../../components/SearchBar'
import { Slider } from '../../components/basic/Slider/Slider'
import { Select } from '../../components/basic/Select/Select'
import { SidebarSwitch } from './SidebarSwitch'
import { useAppDispatch, useAppSelector } from '../../store'
import { shallowEqual } from 'react-redux'
import { setSidebarWidth } from './sidebarSlice'
import { setDisplayMode, setItemWidth } from '../itemFlow/itemFlowSlice'
import { createItem, displayItem, getItemFromState } from '../global/item'
import { IndexTree } from '../indexTree/IndexTree'
import { RecentList } from '../recentList/RecentList'

export const Sidebar = () => {
  const dispatch = useAppDispatch()
  const title = useAppSelector(s => s.siteTitle)
  const subtitle = useAppSelector(s => s.siteSubtitle)
  const displaiedUris = useAppSelector(s => s.opened.uris)
  const sidebarWidth = useAppSelector(s => s.sidebar.width)
  const sidebarShow = useAppSelector(s => s.sidebar.show)
  const itemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const displayMode = useAppSelector(s => s.itemFlow.displayMode)
  const activeTitles = useAppSelector(
    s => Object.fromEntries(displaiedUris.map(uri => [uri, getItemFromState(s, uri).title])),
    shallowEqual
  )

  return (
    <div>
      <SidebarSwitch />
      <div
        className="kiwi-sidebar"
        style={{
          display: sidebarShow ? 'flex' : 'none',
          flexDirection: 'column',
          ...(isMobile ? {} : { width: sidebarWidth }),
        }}
      >
        <h1 className="site-title" id="site-title">
          {title}
        </h1>
        <div className="site-subtitle" id="site-subtitle">
          {subtitle}
        </div>
        <div className="page-controls">
          {getCookie('token') !== '' ? (
            <>
              <IconButton
                iconName="Add"
                title="New Item"
                onClick={async () => {
                  const finalUri = await createItem('new-item')
                  await displayItem(finalUri, 'edit')
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
              <div className="kiwi-active-list-item" key={uri} onClick={() => displayItem(uri)}>
                {activeTitles[uri]}
              </div>
            ))}
          </PivotItem>
          <PivotItem name="Index">
            <IndexTree />
          </PivotItem>
          <PivotItem name="Recent">
            <RecentList />
          </PivotItem>
          <PivotItem name="Action">
            <Banner text="Account" />
            <LoginForm />
            <Banner text="UI" />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Item Width</div>
            <Slider value={itemWidth} onChange={val => dispatch(setItemWidth(parseInt(val)))} range={[350, 1500]} />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Sidebar Width</div>
            <Slider
              value={sidebarWidth}
              onChange={val => dispatch(setSidebarWidth(parseInt(val)))}
              range={[200, 700]}
            />
            <div style={{ textAlign: 'center', margin: '10px 0 10px 0' }}>Flow Type</div>
            <Select
              value={
                {
                  center: 'Center',
                  flow: 'Flow',
                }[displayMode]
              }
              style={{ height: 23 }}
              onSelect={val => dispatch(setDisplayMode(val as FlowDisplayMode))}
            >
              <option value="center">Center</option>
              <option value="flow">Flow</option>
            </Select>
          </PivotItem>
        </Pivot>
      </div>
    </div>
  )
}
