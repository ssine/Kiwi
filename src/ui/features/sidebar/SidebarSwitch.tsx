import React from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { hideSidebar, showSidebar } from './sidebarSlice'

export const SidebarSwitch = () => {
  const show = useAppSelector(state => state.sidebar.show)
  const dispatch = useAppDispatch()

  return (
    <div
      className="kiwi-sidebar-switch"
      onClick={() => {
        if (show) {
          dispatch(hideSidebar())
        } else {
          dispatch(showSidebar())
        }
      }}
    >
      <a>
        <i className="ms-Icon ms-Icon--DoubleChevronLeft" style={{ transform: `rotateY(${show ? 0 : 180}deg)` }} />
      </a>
    </div>
  )
}
