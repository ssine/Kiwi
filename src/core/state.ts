import { observable, reaction } from 'mobx'
import { MainConfig, SecretConfig } from './config'
import { MIME } from './MimeType'
import { Parser } from './Parser'
import { RenderPlugin } from './plugin'
import { StorageProvider } from './Storage'

interface UserAccount {
  name: string
  token: string
}

export type GlobalState = {
  parserMap: Map<MIME, Parser>
  pluginMap: { [name: string]: RenderPlugin }
  storage: StorageProvider
  systemStorage: StorageProvider
  mainConfig: MainConfig
  secretConfig: SecretConfig
  accounts: UserAccount[]
}

export const state = observable({}) as GlobalState
// HACK above: cast type to initialize later together in main.ts
