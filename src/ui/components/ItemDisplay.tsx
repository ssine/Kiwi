import React, { useEffect, useRef, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { Breadcrumb } from './basic/Breadcrumb/Breadcrumb'
import { PrimaryButton } from './basic/Button/PrimaryButton'
import { IconButton } from './basic/Button/IconButton'
import { getCookie, isLinkInternal, isMobile } from '../Common'
import { eventBus } from '../eventBus'
import { encodeItemURI, resolveURI, timeFormat } from '../../core/Common'
import { MenuButton } from './basic/Button/MenuButton'
import { AttachDirection, Callout } from './basic/Callout/Callout'
import { ItemManager } from '../ItemManager'
import { typesetMath } from '../mathjax'

const manager = ItemManager.getInstance()

export const ItemDisplay = (props: {
  uri: string
  item: ClientItem
  onBeginEdit: () => void
  onClose: () => void
  onDelete: () => void
  onPrint: () => void
  fullscreen: boolean
  setFullscreen: (fullscreen: boolean) => void
}) => {
  const { uri, item, onBeginEdit, onClose, onDelete, onPrint, fullscreen, setFullscreen } = props
  const [deleteCalloutVisible, setDeleteCalloutVisible] = useState(false)
  const contentRef = useRef()

  useEffect(() => {
    contentPostProcess(contentRef.current)
  }, [])

  const dropdownItems = [
    {
      id: 'Copy PermaLink',
      text: 'Copy PermaLink',
      iconName: 'Link',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/#${encodeItemURI(uri)}`)
      },
    },
    {
      id: 'Print Item',
      text: 'Print Item',
      iconName: 'Print',
      onClick: onPrint,
    },
  ]
  if (getCookie('token') !== '') {
    dropdownItems.push({
      id: 'Create Sibling',
      text: 'Create Sibling',
      iconName: 'Add',
      onClick: () => {
        eventBus.emit('create-item-clicked', {
          targetURI: resolveURI(uri, 'new-item'),
        })
      },
    })
    dropdownItems.push({
      id: 'Duplicate Item',
      text: 'Duplicate Item',
      iconName: 'Copy',
      onClick: () => {
        const newUri = manager.duplicateItem(uri)
        eventBus.emit('item-link-clicked', {
          targetURI: newUri,
        })
      },
    })
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <Breadcrumb
            items={uri.split('/').map((part, idx, arr) => ({
              name: part,
              uri: arr.slice(0, idx + 1).join('/'),
            }))}
            getKey={i => i.uri}
            renderer={i => i.name}
            onItemClick={i =>
              eventBus.emit('item-link-clicked', {
                targetURI: i.uri,
              })
            }
          />
        </div>
        <div className="item-controls" style={{ display: 'flex' }}>
          {dropdownItems.length > 0 && (
            <MenuButton
              iconOnly={true}
              iconName="ChevronDown"
              menuProps={{ items: dropdownItems }}
              style={{ height: '100%' }}
            />
          )}
          {fullscreen ? (
            <IconButton iconName="FocusView" onClick={() => setFullscreen(false)} />
          ) : (
            <IconButton iconName="FullView" onClick={() => setFullscreen(true)} />
          )}
          {getCookie('token') !== '' && (
            <>
              <Callout
                visible={deleteCalloutVisible}
                direction={AttachDirection.bottomLeftEdge}
                onDismiss={() => setDeleteCalloutVisible(false)}
                style={{ transform: 'translateX(-35%)' }}
                content={<PrimaryButton title="Confirm Delete" onClick={onDelete} />}
              >
                <IconButton iconName="Delete" onClick={() => setDeleteCalloutVisible(true)} />
              </Callout>
              <IconButton iconName="Edit" onClick={onBeginEdit} />
            </>
          )}
          <IconButton iconName="Cancel" onClick={onClose} />
        </div>
      </div>
      <div className="item-titlebar">
        <h2 className="item-title" style={{ margin: 7 }}>
          {item.title}
        </h2>
      </div>
      <div className="item-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: item.renderedHTML }} />
      <div className="item-info" style={{ color: 'grey', paddingLeft: 20 }}>
        {(item.header.author || item.header.createTime) && 'Created'}
        {item.header.author && ` by ${item.header.author}`}
        {item.header.createTime && ` at ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.createTime))}`}
        {item.header.modifyTime &&
          `. Last modification: ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.modifyTime))}`}
      </div>
      <div className="item-tags">
        {item.header.tags?.map(tag => {
          const menuProps = manager.tagMap[tag]?.map(tagUri => {
            const tagItem = manager.getItem(tagUri)
            return {
              id: tagUri,
              key: tagUri,
              text: tagItem.title,
              onClick: () => eventBus.emit('item-link-clicked', { targetURI: tagUri }),
            }
          })
          return (
            <MenuButton
              name={tag}
              key={tag}
              style={{ paddingLeft: 10, paddingRight: 10 }}
              menuProps={{
                items: menuProps,
                styles: {
                  text: {
                    height: isMobile ? '10vw' : 35,
                    paddingRight: isMobile ? '5vw' : 10,
                    paddingLeft: isMobile ? '5vw' : 10,
                  },
                },
              }}
            />
          )
        })}
      </div>
    </>
  )
}

export const contentPostProcess = async (contentEl: HTMLDivElement) => {
  const links = contentEl.querySelectorAll('a')
  links.forEach((el: HTMLAnchorElement | SVGAElement) => {
    if (el instanceof SVGAElement) {
      if (el.href.baseVal.trim().startsWith('http')) {
        el.target.baseVal = '_blank'
      } else {
        el.onclick = async evt => {
          evt.cancelBubble = true
          evt.stopPropagation()
          evt.preventDefault()
          eventBus.emit('item-link-clicked', {
            // emitterURI: this.item.uri,
            targetURI: decodeURIComponent(el.href.baseVal),
          })
          return false
        }
        el.classList.add('item-link')
      }
      return
    }
    if (isLinkInternal(el)) {
      const elUri = decodeURIComponent(el.getAttribute('href'))
      el.onclick = async evt => {
        evt.cancelBubble = true
        evt.stopPropagation()
        evt.preventDefault()
        eventBus.emit('item-link-clicked', {
          // we have resolved all links on server side
          // emitterURI: this.item.uri,
          targetURI: elUri,
        })
        return false
      }
      el.classList.add('item-link')
      if (!manager.hasItem(elUri)) {
        el.classList.add('item-link-missing')
      }
    } else {
      el.target = '_blank'
    }
  })

  // execute scripts
  const scripts = contentEl.getElementsByTagName('script')
  for (let idx = 0; idx < scripts.length; idx++) {
    const script = scripts.item(idx)
    const newScript = document.createElement('script')
    const scriptContent = document.createTextNode(script.text)
    newScript.appendChild(scriptContent)
    let onLoad = null
    script.insertAdjacentElement('afterend', newScript)
    if (script.src !== '') {
      newScript.src = script.src
      newScript.async = true
      onLoad = waitScriptLoad(newScript)
    }
    script.remove()
    if (onLoad) await onLoad
  }

  if (contentEl.innerText.includes('$')) {
    typesetMath()
  }
}

const waitScriptLoad = async (sc: HTMLScriptElement): Promise<void> => {
  return new Promise((res, rej) => {
    sc.addEventListener('load', () => {
      res()
    })
  })
}
