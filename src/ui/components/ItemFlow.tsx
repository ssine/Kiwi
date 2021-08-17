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

type ComposedType = {
  ref: React.RefObject<HTMLDivElement>
  uri: string
  idx: number
}

export const ItemFlow = (props: {
  uris: string[]
  displayMode: FlowDisplayMode
  itemWidth: number
  sidebarWidth: number
  dispatch: React.Dispatch<any>
  style?: CSSProperties
}) => {
  const { uris, itemWidth, sidebarWidth, dispatch, style, displayMode } = props
  const genComposedUris = (us: string[]) => us.map((uri, idx) => ({ ref: createRef<HTMLDivElement>(), uri, idx }))

  const [composedUris, setComposedUris] = useState(genComposedUris(uris)) // ref在setstate之后不会保留，考虑换成uri->ref的map手动维护
  const [flows, setFlows] = useState<ComposedType[][]>([])

  const updateFlow = (cUris: ComposedType[]) => {
    let tmpFlows: ComposedType[][] = []
    if (displayMode === 'center') {
      tmpFlows = [cUris]
    } else {
      const heights = []
      console.log(window.innerWidth, itemWidth, Math.floor((window.innerWidth - sidebarWidth - 30) / (itemWidth + 40)))
      for (let idx = 0; idx < Math.floor((window.innerWidth - sidebarWidth - 30) / (itemWidth + 40)); idx++) {
        tmpFlows.push([])
        heights.push(0)
      }
      if (tmpFlows.length === 0) {
        tmpFlows.push([])
        heights.push(0)
      }
      for (let c of cUris) {
        const minIdx = argMin(heights)
        tmpFlows[minIdx].push(c)
        heights[minIdx] += (c.ref.current?.getBoundingClientRect?.()?.height || 0) + 40
      }
    }
    console.log(tmpFlows, flows)
    const oldPosition = {}
    flows.forEach((flow, flowIdx) => {
      flow.forEach(c => {
        oldPosition[c.uri] = flowIdx
      })
    })
    tmpFlows.forEach((flow, flowIdx) => {
      flow.forEach((c, cidx) => {
        if (!(c.uri in oldPosition)) {
          return
        }
        if (oldPosition[c.uri] === flowIdx) {
          return
        }
        console.log('send', String(oldPosition[c.uri]), String(flowIdx), c.uri, cidx)
        sendReparentableChild(String(oldPosition[c.uri]), String(flowIdx), c.uri, cidx)
      })
    })
    if (
      tmpFlows.length !== 0 &&
      tmpFlows[0].length !== 0 &&
      !tmpFlows.every((lst, i) => lst.every((val, j) => val.uri === flows[i]?.[j]?.uri))
    ) {
      console.log('set', tmpFlows)
      setFlows([...tmpFlows, []])
    }
  }

  useEffect(() => {
    const newCUris = genComposedUris(uris)
    setComposedUris(newCUris)
    updateFlow(newCUris)
  }, [uris])

  useLayoutEffect(() => {
    updateFlow(composedUris)
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
      {flows.map((flow, idx) => (
        <div style={{ marginLeft: 30 }} key={idx}>
          <Reparentable id={String(idx)}>
            {flow.map(val => (
              <ItemCard
                key={val.uri}
                uri={val.uri}
                containerRef={composedUris[val.idx].ref}
                itemWidth={itemWidth}
                onClose={() => {
                  dispatch({ type: 'remove', uri: val.uri })
                }}
                onChange={(target: string) => {
                  dispatch({ type: 'change', fromUri: val.uri, toUri: target })
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
  if (window.location.hash != '') {
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
