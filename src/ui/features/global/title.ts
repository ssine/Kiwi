import { CaseReducer, PayloadAction, createAction } from '@reduxjs/toolkit'
import { RootState } from '..'

export const setTitle = createAction<string>('setSiteTitle')
export const setTitleReducer: CaseReducer<RootState, PayloadAction<string>> = (state, action) => {
  state.siteTitle = action.payload
}

export const setSubtitle = createAction<string>('setSiteSubtitle')
export const setSubtitleReducer: CaseReducer<RootState, PayloadAction<string>> = (state, action) => {
  state.siteSubtitle = action.payload
}
