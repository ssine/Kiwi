import React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { ClientItem } from '../ClientItem'
import { StaticItemPage } from './staticItemPage'
import { CSSColorToRGBA, getColorScheme, RGBtoHSV } from '../Common'
import { state } from '../../core/state'

export type StaticConfig = {
  paths: { uri: string; title: string }[]
}

export const getStaticItemHTML = (uri: string, item: ClientItem, config: StaticConfig) => {
  return ReactDOMServer.renderToString(
    <html
      style={{
        display: 'block',
        ...getColorScheme(RGBtoHSV(CSSColorToRGBA(state.mainConfig.appearance.primaryColor)).h || 0),
      }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{item.title + ' - ' + state.mainConfig.info.title}</title>
        <script defer src="/staticPage.bundle.js" />
        <link rel="shortcut icon" href={`/raw/${state.mainConfig.appearance.favicon}`} type="image/x-icon" />
        <link rel="stylesheet" href="/raw/kiwi/ui/css/global.css"></link>
        <link rel="stylesheet" href="/raw/kiwi/ui/css/fabric-icons.css" />
        <link rel="stylesheet" href="/raw/kiwi/ui/css/solarized-light.css" />
      </head>
      <body>
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10, marginLeft: 20 }}>
          {config.paths.map((path, idx) => (
            <div key={path.uri} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <a href={path.uri} className="item-link">
                {path.title}
              </a>
              {idx !== config.paths.length - 1 && (
                <div style={{ paddingLeft: 5, paddingRight: 5 }} className="ms-Icon ms-Icon--ChevronRight"></div>
              )}
            </div>
          ))}
        </div>
        <div id="static-page-root">
          <StaticItemPage uri={uri} item={item} />{' '}
        </div>
      </body>
    </html>
  )
}
