import React, { useEffect, useReducer, useState } from 'react'
import { ClientItem } from '../ClientItem'
import { Breadcrumb } from './basic/Breadcrumb/Breadcrumb'
import { PrimaryButton } from './basic/Button/PrimaryButton'
import { IconButton } from './basic/Button/IconButton'
import { getCookie } from '../Common'
import { eventBus } from '../eventBus'
import { resolveURI } from '../../core/Common'
import { MenuButton } from './basic/Button/MenuButton'
import { AttachDirection, Callout } from './basic/Callout/Callout'

export const ItemDisplay = (props: {
  uri: string
  item: ClientItem
  onBeginEdit: () => void
  onClose: () => void
  onDelete: () => void
}) => {
  const { uri, item, onBeginEdit, onClose, onDelete } = props
  const [deleteCalloutVisible, setDeleteCalloutVisible] = useState(false)

  const dropdownItems = [
    {
      id: 'Copy PermaLink',
      text: 'Copy PermaLink',
      iconName: 'Link',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/#${uri}`)
      },
    },
  ]
  if (getCookie('token') !== '') {
    dropdownItems.push({
      id: 'Create Sibling',
      text: 'Create Sibling',
      iconName: 'Add',
      onClick: () => {
        eventBus.emit('create-item-clicked', {
          uri: resolveURI(uri, 'new-item'),
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
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <Breadcrumb
            items={uri.split('/').map((part, idx, arr) => ({
              name: part,
              uri: arr.slice(0, idx + 1).join('/'),
            }))}
            getKey={i => i.uri}
            renderer={i => i.name}
            onItemClick={i => eventBus.emit('item-link-clicked', i.uri)}
          />
        </div>
        <div className="item-controls" style={{ display: 'flex' }}>
          {dropdownItems.length > 0 && (
            <MenuButton iconOnly={true} iconName="ChevronDown" menuProps={{ items: dropdownItems }} />
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
      <div className="item-content" dangerouslySetInnerHTML={{ __html: item.renderedHTML }} />
    </>
  )
}
