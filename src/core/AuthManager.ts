/**
 * Management of users
 * @packageDocumentation
 */
import { createHash } from 'crypto'
import { ServerItem } from './ServerItem'
import { PasswordIncorrectError, UserNotExistsError } from './Error'
import { state } from './state'
import { reaction, runInAction } from 'mobx'

reaction(
  () => state.secretConfig,
  config => {
    if (!config) return
    const data = config.users
    runInAction(() => {
      state.accounts = data
        .filter(act => act.name && (act.token || act.password))
        .map(act => ({
          name: act.name,
          token: act.token || getToken(act.name, act.password!),
        }))
    })
  }
)

const getToken = (name: string, pass: string): string => {
  return createHash('sha256').update(`[${name}][${pass}]`).digest('hex')
}

const getNameList = (...args: (string | number | string[] | undefined)[]) => {
  const names = []
  for (const arg of args) {
    if (typeof arg === 'string' || typeof arg === 'number') {
      names.push(String(arg))
    } else if (Array.isArray(arg)) {
      names.push(...arg.map(v => String(v)))
    }
  }
  return names
}

/**
 * Authentication and authorization.
 * Each user gets an unique token that identifies the user.
 */
export class AuthManager {
  static login(name: string, password: string): string {
    for (const act of state.accounts) {
      if (act.name === name) {
        if (act.token === getToken(name, password)) {
          return act.token
        } else {
          throw new PasswordIncorrectError()
        }
      }
    }
    throw new UserNotExistsError()
  }

  static isTokenValid(token: string): boolean {
    for (const act of state.accounts) {
      if (act.token === token) return true
    }
    return false
  }

  static getUserNameFromToken(token: string): string {
    for (const act of state.accounts) {
      if (act.token === token) return act.name
    }
    return 'anonymous'
  }

  static hasReadPermission(token: string, item: ServerItem): boolean {
    const reader = AuthManager.getUserNameFromToken(token)
    if (item.header.author === reader) return true

    const bannedReaders = new Set()
    const allowedReaders = new Set()
    for (const r of getNameList(item.header.reader, item.header.readers)) {
      if (r[0] === '~') {
        bannedReaders.add(r.slice(1))
      } else {
        allowedReaders.add(r)
      }
    }
    return bannedReaders.has(reader) ? false : allowedReaders.size === 0 || allowedReaders.has(reader)
  }

  static hasWritePermission(token: string, item: ServerItem): boolean {
    if (!AuthManager.hasReadPermission(token, item)) return false
    const writer = AuthManager.getUserNameFromToken(token)
    if (writer === 'anonymous') return false
    if (item.header.author === writer) return true

    const bannedWriters = new Set()
    const allowedWriters = new Set()
    for (const r of getNameList(item.header.writer, item.header.writers)) {
      if (r[0] === '~') {
        bannedWriters.add(r.slice(1))
      } else {
        allowedWriters.add(r)
      }
    }
    return bannedWriters.has(writer) ? false : allowedWriters.size === 0 || allowedWriters.has(writer)
  }
}
