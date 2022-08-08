import { CaseReducer, PayloadAction, createAction } from '@reduxjs/toolkit'
import { RootState } from '..'
import { MainConfig } from '../../../core/config'
import { isURL } from '../../../core/Common'
import { setPageColors, CSSColorToRGBA, RGBtoHSV } from '../../Common'

export const setMainConfig = createAction<MainConfig>('setMainConfig')
export const setMainConfigReducer: CaseReducer<RootState, PayloadAction<MainConfig>> = (state, action) => {
  const firstSet = state.config.version === ''
  // some side effects, but in sync for convenience
  if (firstSet || action.payload.info.title !== state.config.info.title) {
    document.title = action.payload.info.title
  }
  if (firstSet || action.payload.appearance.primaryColor !== state.config.appearance.primaryColor) {
    setPageColors(RGBtoHSV(CSSColorToRGBA(action.payload.appearance.primaryColor)).h)
  }
  if (firstSet || action.payload.appearance.favicon !== state.config.appearance.favicon) {
    const el = document.getElementById('favicon-link') as HTMLLinkElement
    if (isURL(action.payload.appearance.favicon)) {
      el.href = action.payload.appearance.favicon
    } else {
      el.href = '/raw/' + action.payload.appearance.favicon
    }
  }

  state.config = action.payload
}
