import React, { useEffect, useRef, useState } from 'react'
import { Breadcrumb } from '../../components/basic/Breadcrumb/Breadcrumb'
import { PrimaryButton } from '../../components/basic/Button/PrimaryButton'
import { IconButton } from '../../components/basic/Button/IconButton'
import { getCookie, getItemCardDiv, isLinkInternal, isMobile, waitScriptLoad } from '../../Common'
import { encodeItemURI, isURL, resolveURI, timeFormat } from '../../../core/Common'
import { MenuButton } from '../../components/basic/Button/MenuButton'
import { AttachDirection, Callout } from '../../components/basic/Callout/Callout'
import { typesetMath } from '../../mathjax'
import { useAppDispatch, useAppSelector } from '../../store'
import { printItem, rotateIn, rotateOut, scaleOut, setItemFullScreen, setItemMode } from './operations'
import {
  closeItem,
  createItem,
  deleteItem,
  displayItem,
  displayOrCreateItem,
  duplicateItem,
  getItem,
  getItemFromState,
} from '../global/item'
import { ContextualMenuItem } from '../../components/basic/Menu/ContextualMenu'
import { MessageType, showMessage } from '../messageList/messageListSlice'

export const ItemDisplay = (props: { uri: string }) => {
  const { uri } = props
  const dispatch = useAppDispatch()
  const item = useAppSelector(s => getItemFromState(s, uri))
  const fullScreen = useAppSelector(s => s.opened.items[uri].fullScreen)
  const tags = useAppSelector(s =>
    (item.header.tags || []).map(tag => ({
      name: tag,
      links: s.tagMap[tag].map(linkUri => ({ uri: linkUri, title: getItemFromState(s, linkUri).title })),
    }))
  )

  const [deleteCalloutVisible, setDeleteCalloutVisible] = useState(false)
  const contentRef = useRef<HTMLElement>()

  useEffect(() => {
    contentPostProcess(contentRef.current!)
  }, [])

  const dropdownItems: ContextualMenuItem[] = [
    {
      id: 'Copy PermaLink',
      text: 'Copy PermaLink',
      iconName: 'Link',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/#${encodeItemURI(uri)}`)
      },
    },
    {
      id: 'Copy Static Link',
      text: 'Copy Static Link',
      iconName: 'Link',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/static/${encodeItemURI(uri)}`)
      },
    },
    {
      id: 'Print Item',
      text: 'Print Item',
      iconName: 'Print',
      onClick: () => printItem(uri),
    },
  ]
  if (getCookie('token') !== '') {
    dropdownItems.push({
      id: 'Create Sibling',
      text: 'Create Sibling',
      iconName: 'Add',
      onClick: async () => {
        const newUri = await createItem(resolveURI(uri, 'new-item'))
        displayItem(newUri)
      },
    })
    dropdownItems.push({
      id: 'Duplicate Item',
      text: 'Duplicate Item',
      iconName: 'Copy',
      onClick: async () => {
        const newUri = await duplicateItem(uri)
        displayItem(newUri)
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
            onItemClick={i => displayOrCreateItem(i.uri)}
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
          {fullScreen ? (
            <IconButton iconName="FocusView" onClick={() => setItemFullScreen({ uri, fullScreen: false })} />
          ) : (
            <IconButton iconName="FullView" onClick={() => setItemFullScreen({ uri, fullScreen: true })} />
          )}
          {getCookie('token') !== '' && (
            <>
              <Callout
                visible={deleteCalloutVisible}
                direction={AttachDirection.bottomLeftEdge}
                onDismiss={() => setDeleteCalloutVisible(false)}
                style={{ transform: 'translateX(-35%)' }}
                content={
                  <PrimaryButton
                    title="Confirm Delete"
                    onClick={async () => {
                      // TODO: concurrent slideout and delete, and reset effect if delete failed
                      await deleteItem(props.uri)
                      await scaleOut(getItemCardDiv(uri))
                    }}
                  />
                }
              >
                <IconButton iconName="Delete" onClick={() => setDeleteCalloutVisible(true)} />
              </Callout>
              <IconButton
                iconName="Edit"
                onClick={async () => {
                  await rotateOut(getItemCardDiv(uri))
                  dispatch(setItemMode({ uri, mode: 'edit' }))
                  await rotateIn(getItemCardDiv(uri))
                }}
              />
            </>
          )}
          <IconButton
            iconName="Cancel"
            onClick={async () => {
              await scaleOut(getItemCardDiv(uri))
              dispatch(closeItem(uri))
            }}
          />
        </div>
      </div>
      <div className="item-titlebar">
        <h2 className="item-title" style={{ margin: 7 }}>
          {item.title}
        </h2>
      </div>
      {item.type === 'text/html' ? (
        <iframe
          src={`/raw/${uri}`}
          // @ts-ignore
          ref={contentRef}
          frameBorder="0"
          onLoad={() => setIframeHeight(contentRef.current as HTMLIFrameElement)}
          style={{ width: '100%', maxHeight: 800 }}
        />
      ) : (
        // @ts-ignore
        <div className="item-content" ref={contentRef} dangerouslySetInnerHTML={{ __html: item.renderedHTML }} />
      )}
      <div className="item-info" style={{ color: 'grey', paddingLeft: 20 }}>
        {(item.header.author || item.header.createTime) && 'Created'}
        {item.header.author && ` by ${item.header.author}`}
        {item.header.createTime && ` at ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.createTime))}`}
        {item.header.modifyTime &&
          `. Last modification: ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.modifyTime))}`}
      </div>
      <div className="item-tags">
        {tags.map(({ name, links }) => {
          const menuProps = links.map(({ uri, title }) => ({
            id: uri,
            key: uri,
            text: title,
            onClick: () => displayItem(uri),
          }))
          return (
            <MenuButton
              name={name}
              key={name}
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

export const contentPostProcess = async (contentEl: HTMLElement) => {
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
          displayOrCreateItem(el.href.baseVal)
          return false
        }
        el.classList.add('item-link')
      }
      return
    }
    if (isLinkInternal(el)) {
      const href = el.getAttribute('href') || ''
      if (isURL(href)) return
      const elUri = decodeURIComponent(href)
      const missing = !getItem(elUri)
      el.onclick = async evt => {
        evt.cancelBubble = true
        evt.stopPropagation()
        evt.preventDefault()
        if (missing) {
          if (getCookie('token') !== '') {
            await createItem(elUri)
          } else {
            showMessage({ type: MessageType.error, text: `no read permission to ${elUri}!`, liveSecond: 5 })
            return false
          }
        }
        await displayItem(elUri)
        return false
      }
      el.classList.add('item-link')
      if (missing) {
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
    if (!script) return
    const newScript = document.createElement('script')
    const scriptContent = document.createTextNode(script.text)
    newScript.appendChild(scriptContent)
    let onLoad: Promise<void> | null = null
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

const setIframeHeight = (el: HTMLIFrameElement) => {
  el.style.height = `${el.contentWindow?.document.body.scrollHeight}px`
}
