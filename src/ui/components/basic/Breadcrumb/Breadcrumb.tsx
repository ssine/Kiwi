import React, { useLayoutEffect, useRef, useState } from 'react'
import { MenuButton } from '../Button/MenuButton'
import './Breadcrumb.css'

export const Breadcrumb = <T,>(props: {
  items: T[]
  getKey: (item: T) => string
  onItemClick?: (item: T) => void
  renderer?: (item: T) => JSX.Element | string
}) => {
  const { items, onItemClick, getKey, renderer } = props
  const [fold, setFold] = useState({ start: 0, end: 0 })

  const ref = useRef<HTMLDivElement>()

  useLayoutEffect(() => {
    if (ref.current.scrollWidth > ref.current.offsetWidth && fold.end < items.length) {
      setFold({ ...fold, end: fold.end + 1 })
    }
  }, [ref, fold])

  const renderList = (items: T[]): JSX.Element[] => {
    if (items.length === 0) return []
    const elements = []
    items.forEach(item => {
      elements.push(<div key={`${getKey(item)}-chevron`} className="ms-Icon ms-Icon--ChevronRight"></div>)
      elements.push(
        <button
          className="kiwi-breadcrumb-item"
          key={getKey(item)}
          onClick={onItemClick ? () => onItemClick(item) : null}
        >
          {renderer ? renderer(item) : item}
        </button>
      )
    })
    return elements.slice(1)
  }

  const renderFoldedList = (items: T[]) => {
    if (items.length === 0) return <></>
    return (
      <MenuButton
        name="none"
        iconName="ChevronDown"
        iconOnly={true}
        key="fold"
        calloutWarpperStyle={{ height: '100%' }}
        style={{ height: '100%' }}
        menuProps={{
          items: items.map(it => {
            return {
              id: getKey(it),
              text: renderer ? renderer(it) : String(it),
              onClick: onItemClick ? () => onItemClick(it) : null,
            }
          }),
          styles: {
            text: {
              fontSize: '1.2rem',
              fontFamily: 'var(--sansSerifFont)',
              height: '2rem',
              paddingLeft: 5,
              paddingRight: 5,
            },
          },
        }}
      />
    )
  }

  return (
    <div ref={ref} className="kiwi-breadcrumb">
      {renderList(items.slice(0, fold.start))}
      {renderFoldedList(items.slice(fold.start, fold.end))}
      {renderList(items.slice(fold.end))}
    </div>
  )
}
