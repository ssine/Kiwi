import React, { createRef, CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { eventBus } from '../eventBus'
import { ItemManager } from '../ItemManager'
import { ItemCard } from './ItemCard'
import { defaultItemsURI } from '../../boot/config'
import { FlowDisplayMode, getCookie } from '../Common'
import { argMin } from '../../core/Common'
import { createReparentableSpace } from 'react-reparenting'

const { Reparentable, sendReparentableChild } = createReparentableSpace()

const manager = ItemManager.getInstance()

const getNumColumns = (sidebarWidth: number, itemWidth: number): number => {
  return Math.max(Math.floor((window.innerWidth - sidebarWidth - 30) / (itemWidth + 40)), 1)
}

export const ItemFlow = (props: {
  uris: string[]
  displayMode: FlowDisplayMode
  itemWidth: number
  sidebarWidth: number
  dispatch: React.Dispatch<any>
  style?: CSSProperties
}) => {
  const { uris, itemWidth, sidebarWidth, dispatch, displayMode } = props

  const itemRefs = useRef(Object.fromEntries(uris.map(u => [u, createRef<HTMLDivElement>()])))
  const [flows, setFlows] = useState<string[][]>([])

  const updateFlow = () => {
    let tmpFlows: string[][] = []
    if (displayMode === 'center') {
      tmpFlows = [uris]
    } else {
      const heights = []
      for (let idx = 0; idx < getNumColumns(sidebarWidth, itemWidth); idx++) {
        tmpFlows.push([])
        heights.push(0)
      }
      for (const u of uris) {
        const minIdx = argMin(heights)
        tmpFlows[minIdx].push(u)
        heights[minIdx] += (itemRefs.current[u]?.current?.getBoundingClientRect?.()?.height || 0) + 40
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

  useEffect(() => {
    // uri change => update ref
    uris
      .filter(u => !(u in itemRefs.current))
      .forEach(uri => {
        itemRefs.current[uri] = createRef<HTMLDivElement>()
      })
    Object.keys(itemRefs.current)
      .filter(u => !uris.includes(u))
      .forEach(uri => {
        delete itemRefs.current[uri]
      })
  }, [uris])

  useLayoutEffect(() => {
    updateFlow()
  })

  useEffect(() => {
    eventBus.on('item-link-clicked', onDisplayItem)
    eventBus.on('create-item-clicked', onCreateItem)
    displayInitItems()
    return () => {
      eventBus.off('item-link-clicked', onDisplayItem)
      eventBus.off('create-item-clicked', onCreateItem)
    }
  }, [])

  const onDisplayItem = async (data: { targetURI: string }) => {
    if (!manager.hasItem(data.targetURI) && getCookie('token') !== '') return onCreateItem(data)
    await manager.ensureItemLoaded(data.targetURI)
    dispatch({ type: 'display', uri: data.targetURI })
  }

  const onCreateItem = async (data: { targetURI?: string }) => {
    const uri = manager.createItem(data?.targetURI)
    dispatch({ type: 'display', uri: uri })
  }

  return (
    <div className="item-flow-container" style={{ marginLeft: sidebarWidth + 30, display: 'flex' }}>
      {[...flows, [] /* add an empty column to avoid remounting of elements sent to new column */].map((flow, idx) => (
        <div style={{ marginLeft: 30 }} key={idx}>
          <Reparentable id={String(idx)}>
            {flow.map(uri => (
              <ItemCard
                key={uri}
                uri={uri}
                containerRef={itemRefs.current[uri]}
                itemWidth={itemWidth}
                onClose={() => {
                  dispatch({ type: 'remove', uri: uri })
                }}
                onChange={(target: string) => {
                  dispatch({ type: 'change', fromUri: uri, toUri: target })
                }}
              />
            ))}
          </Reparentable>
        </div>
      ))}
    </div>
  )
}

const displayInitItems = async () => {
  if (window.location.hash !== '') {
    // have uris in has
    eventBus.emit('item-link-clicked', {
      targetURI: window.location.hash.substr(1),
    })
  } else {
    // render default items
    await manager.ensureItemLoaded(defaultItemsURI)
    manager
      .getItem(defaultItemsURI)
      .content.split('\n')
      .forEach(
        uri =>
          uri &&
          eventBus.emit('item-link-clicked', {
            targetURI: uri,
          })
      )
  }
}
