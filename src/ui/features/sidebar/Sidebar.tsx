import React, { useState } from 'react'
import { Resizable, ResizeCallbackData } from 'react-resizable'
import { getCookie, isMobile } from '../../Common'
import { IconButton } from '../../components/basic/Button/IconButton'
import { Pivot, PivotItem } from '../../components/basic/Pivot/Pivot'
import { Banner } from '../../components/basic/Banner/Banner'
import LoginForm from '../../components/LoginForm'
import { SearchBar } from '../../components/SearchBar'
import { Slider } from '../../components/basic/Slider/Slider'
import { useAppDispatch, useAppSelector } from '../../store'
import { shallowEqual } from 'react-redux'
import { hideSidebar, setSidebarWidth, showSidebar } from './sidebarSlice'
import { setItemWidth } from '../itemFlow/itemFlowSlice'
import { createItem, displayItem, getItemFromState } from '../global/item'
import { IndexTree } from '../indexTree/IndexTree'
import { RecentList } from '../recentList/RecentList'
import { ResizeHandle } from '../../components/ResizeHandle'

export const Sidebar = () => {
  const dispatch = useAppDispatch()
  const title = useAppSelector(s => s.config.info.title)
  const subtitle = useAppSelector(s => s.config.info.subtitle)
  const displaiedUris = useAppSelector(s => s.opened.uris)
  const sidebarWidth = useAppSelector(s => s.sidebar.width)
  const sidebarShow = useAppSelector(s => s.sidebar.show)
  const itemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const activeTitles = useAppSelector(
    s => Object.fromEntries(displaiedUris.map(uri => [uri, getItemFromState(s, uri).title])),
    shallowEqual
  )
  const [resizerWidth, setResizerWidth] = useState(sidebarShow ? sidebarWidth : 0)
  const onResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setResizerWidth(data.size.width)
    if (data.size.width > 330) {
      if (!sidebarShow) {
        dispatch(showSidebar())
      }
      dispatch(setSidebarWidth(data.size.width))
    } else if (data.size.width < 50 && sidebarShow) {
      dispatch(hideSidebar())
    }
  }
  return (
    <div>
      <Resizable
        height={0}
        width={resizerWidth}
        onResize={onResize}
        handle={(handleAxis, ref) => (
          <ResizeHandle ref={ref} handleAxis={handleAxis} thickness={5} orientation="vertical" showDots={true} />
        )}
      >
        <div
          className="kiwi-sidebar"
          style={{ display: 'flex', flexDirection: 'row', width: sidebarWidth, overflow: 'hidden' }}
        >
          <div
            style={{
              flexGrow: 2,
              display: sidebarShow ? 'flex' : 'none',
              flexDirection: 'column',
              paddingLeft: 20,
              paddingRight: 10,
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
                      await displayItem(finalUri, { mode: 'edit' })
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
              </PivotItem>
            </Pivot>
          </div>
        </div>
      </Resizable>
    </div>
  )
}
