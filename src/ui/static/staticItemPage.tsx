import React from 'react'
import { timeFormat } from '../../core/Common'
import { ClientItem } from '../ClientItem'

export const StaticItemPage = (props: { uri: string; item: ClientItem }) => {
  const { uri, item } = props
  const tags = item.header.tags || []
  return (
    <div>
      <div className="item static-item">
        <div className="item-titlebar">
          <h2 className="item-title" style={{ paddingTop: 20, paddingLeft: 20 }}>
            {item.title}
          </h2>
        </div>
        {item.type === 'text/html' ? (
          <iframe
            src={`/static/${uri}`}
            srcDoc={item.content}
            frameBorder="0"
            style={{ width: '100%', maxHeight: 800 }}
          />
        ) : (
          <div className="item-content" dangerouslySetInnerHTML={{ __html: item.renderedHTML }} />
        )}
        <div className="item-info" style={{ color: 'grey', paddingLeft: 20 }}>
          {(item.header.author || item.header.createTime) && 'Created'}
          {item.header.author && ` by ${item.header.author}`}
          {item.header.createTime && ` at ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.createTime))}`}
          {item.header.modifyTime &&
            `. Last modification: ${timeFormat('YYYY-MM-DD HH:mm:ss', new Date(item.header.modifyTime))}`}
        </div>
        <div>{tags.join(', ')}</div>
        <div style={{ height: 20 }}></div>
      </div>
    </div>
  )
}
