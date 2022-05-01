import React, { useEffect, useLayoutEffect, useState } from 'react'
import { ItemCard } from '../itemCard/ItemCard'
import { defaultItemsURI } from '../../../boot/config'
import { argMin } from '../../../core/Common'
import { createReparentableSpace } from 'react-reparenting'
import { useAppSelector } from '../../store'
import { displayItem, getItem, loadItem } from '../global/item'
import { getItemCardDiv } from '../../Common'

const { Reparentable, sendReparentableChild } = createReparentableSpace()

const getNumColumns = (showSidebar: boolean, sidebarWidth: number, itemWidth: number): number => {
  return Math.max(Math.floor((window.innerWidth - (showSidebar ? sidebarWidth : 0) - 30) / (itemWidth + 40)), 1)
}

export const ItemFlow = () => {
  const displayMode = useAppSelector(s => s.itemFlow.displayMode)
  const itemWidth = useAppSelector(s => s.itemFlow.itemWidth)
  const showSidebar = useAppSelector(s => s.sidebar.show)
  const sidebarWidth = useAppSelector(s => s.sidebar.width)
  const uris = useAppSelector(s => s.opened.uris)

  const [flows, setFlows] = useState<string[][]>([])

  const updateFlow = () => {
    let tmpFlows: string[][] = []
    if (displayMode === 'center') {
      tmpFlows = [uris]
    } else {
      const heights = []
      for (let idx = 0; idx < getNumColumns(showSidebar, sidebarWidth, itemWidth); idx++) {
        tmpFlows.push([])
        heights.push(0)
      }
      for (const u of uris) {
        const minIdx = argMin(heights)
        tmpFlows[minIdx].push(u)
        heights[minIdx] += (getItemCardDiv(u)?.getBoundingClientRect?.()?.height || 0) + 25
      }
    }
    const oldPosition = {}
    flows.forEach((flow, flowIdx) => {
      flow.forEach(u => {
        oldPosition[u] = flowIdx
      })
    })
    tmpFlows.forEach((flow, flowIdx) => {
      flow.forEach((u, cidx) => {
        if (!(u in oldPosition) || oldPosition[u] === flowIdx) return
        sendReparentableChild(String(oldPosition[u]), String(flowIdx), u, cidx)
      })
    })
    if (
      flows.length === tmpFlows.length &&
      tmpFlows.every(
        (flow, fidx) => flow.length === flows[fidx].length && flow.every((uri, uidx) => uri === flows[fidx][uidx])
      )
    ) {
      return
    }
    setFlows(tmpFlows)
  }

  useLayoutEffect(() => {
    updateFlow()
  })

  useEffect(() => {
    displayInitItems()
  }, [])

  return displayMode === 'flow' ? (
    <div
      className="item-flow-container"
      style={{ marginLeft: (showSidebar ? sidebarWidth : 0) + 30, display: 'flex', marginTop: 25 }}
    >
      {[...flows, [] /* add an empty column to avoid remounting of elements sent to new column */].map((flow, idx) => (
        <div style={{ marginLeft: 30 }} key={idx}>
          <Reparentable id={String(idx)}>
            {flow.map(uri => (
              <ItemCard key={uri} uri={uri} />
            ))}
          </Reparentable>
        </div>
      ))}
    </div>
  ) : (
    <div className="item-flow-container" style={{ margin: '25px auto', display: 'flex' }}>
      <div style={{ margin: '0 auto' }}>
        <Reparentable id="0">{flows[0]?.map(uri => <ItemCard key={uri} uri={uri} />) || null}</Reparentable>
        <Reparentable id="1">{null}</Reparentable>
      </div>
    </div>
  )
}

const displayInitItems = async () => {
  if (window.location.hash !== '') {
    // have uris in hash
    await displayItem(decodeURIComponent(window.location.hash.substring(1)))
  } else {
    // render default items
    await loadItem(defaultItemsURI)
    getItem(defaultItemsURI)
      .content.split('\n')
      .forEach(uri => uri && displayItem(uri))
  }
}
