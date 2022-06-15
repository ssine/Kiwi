import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { ClientItem } from '../ClientItem'
import { StaticItemPage } from './staticItemPage'

export const getStaticItemHTML = (uri: string, item: ClientItem) => {
  return ReactDOMServer.renderToString(
    <html>
      <head>
        <script defer src="/staticPage.bundle.js" />
      </head>
      <body>
        <div id="static-item-root">
          <StaticItemPage uri={uri} item={item} />{' '}
        </div>
      </body>
    </html>
  )
}
