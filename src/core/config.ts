import { defaultsDeep } from 'lodash'
import { BaseItem } from './BaseItem'
import { safeLoad as loadYaml } from 'js-yaml'
import { InvalidArgumentError } from './Error'
import { MIME } from './MimeType'
import * as semver from 'semver'

export type MainConfig = Configs.MainConfig
export type SecretConfig = Configs.SecretConfig

export const getMainConfig = (item?: BaseItem | null): MainConfig => {
  if (!item) return Configs.defaultMainConfig
  const override = Configs.convertPastMain(loadConfig(item))
  return defaultsDeep(override, Configs.defaultMainConfig) as MainConfig
}

export const getSecretConfig = (item?: BaseItem | null): SecretConfig => {
  if (!item) return Configs.defaultSecretConfig
  const override = Configs.convertPastSecret(loadConfig(item))
  return defaultsDeep(override, Configs.defaultSecretConfig) as SecretConfig
}

const loadConfig = (item: BaseItem): any => {
  const loaders: Partial<Record<MIME, Function>> = {
    'application/json': JSON.parse,
    'text/yaml': loadYaml,
  }
  const loader = loaders[item.type]
  if (!loader) {
    throw new InvalidArgumentError(
      `Global config type ${item.type} not supported. Accepted types: ${Object.keys(loaders)}`
    )
  }
  return loader(item.content)
}

namespace Configs {
  export const convertPastMain = (config: any): MainConfig => {
    const version = config.version as string
    if (semver.satisfies(version, '<0.8.0')) {
      // put conversion logic here, if any.
      return config
    } else if (semver.satisfies(version, '<0.9.0')) {
      return config
    } else {
      throw new InvalidArgumentError(`config version ${version} not supported`)
    }
  }
  export const convertPastSecret = (config: any): MainConfig => {
    const version = config.version as string
    if (semver.satisfies(version, '<0.9.0')) {
      return config
    } else {
      throw new InvalidArgumentError(`config version ${version} not supported`)
    }
  }

  type Main_0_8_0 = {
    version: string
    info: {
      title: string
      subtitle: string
      defaultItems: string[]
    }
    appearance: {
      favicon: string
      primaryColor: string
    }
    render: {
      plugin: {
        paths: string[]
      }
    }
  }

  type Secret_0_8_0 = {
    version: string
    users: { name: string; password?: string; token?: string }[]
  }

  const defaultMain_0_8_0: Main_0_8_0 = {
    version: '',
    info: {
      title: 'Kiwi',
      subtitle: 'A flat file personal wiki',
      defaultItems: ['kiwi/doc/zh/hello-there'],
    },
    appearance: {
      favicon: 'kiwi/ui/icon/favicon.ico',
      primaryColor: '#7e489d',
    },
    render: {
      plugin: {
        paths: ['/kiwi/plugins'],
      },
    },
  }

  const defaultSecret_0_8_0: Secret_0_8_0 = {
    version: '0.8.0',
    users: [{ name: 'admin', password: 'kiwi-admin' }],
  }

  export type MainConfig = Main_0_8_0
  export const defaultMainConfig = defaultMain_0_8_0
  export type SecretConfig = Secret_0_8_0
  export const defaultSecretConfig = defaultSecret_0_8_0
}
