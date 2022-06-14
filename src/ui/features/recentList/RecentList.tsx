import React from 'react'
import { timeFormat } from '../../../core/Common'
import { useAppSelector } from '../../store'
import { displayItem } from '../global/item'
import { ClientItem } from '../../ClientItem'
import { Banner } from '../../components/basic/Banner/Banner'

export const RecentList = () => {
  const items = useAppSelector(s => s.items)
  const groups: Record<string, [string, ClientItem][]> = {}
  Object.entries(items)
    .filter(i => i[1].header.modifyTime)
    .sort((a, b) => b[1].header.modifyTime - a[1].header.modifyTime)
    .slice(0, 50)
    .forEach(i => {
      const dateStr = timeFormat('YYYY-MM-DD', new Date(i[1].header.modifyTime))
      groups[dateStr] = groups[dateStr] || []
      groups[dateStr].push(i)
    })

  return (
    <>
      {Object.entries(groups)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(group => (
          <>
            <Banner text={group[0]} />
            {group[1].map(i => (
              <div className="kiwi-active-list-item" key={i[0]} onClick={() => displayItem(i[0])}>
                {i[1].title}
              </div>
            ))}
          </>
        ))}
    </>
  )
}
