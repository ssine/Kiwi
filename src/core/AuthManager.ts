/**
 * Management of users
 * @packageDocumentation
 */
import { createHash } from 'crypto'
import { ServerItem } from './ServerItem'
import { PasswordIncorrectError, UserNotExistsError } from './Error'
import { SecretConfig } from './config'

interface UserAccount {
  name: string
  token: string
}

/**
 * Authentication and authorization.
 * Each user gets an unique token that identifies the user.
 */
class AuthManager {
  accounts: UserAccount[] = []

  /**
   * Initialize User Manager with stored accounts
   */
  init(config: SecretConfig) {
    const data = config.users
    this.accounts = data
      .filter(act => act.name && (act.token || act.password))
      .map(act => ({
        name: act.name,
        token: act.token || getToken(act.name, act.password!),
      }))
  }

  login(name: string, password: string): string {
    for (const act of this.accounts) {
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

  isTokenValid(token: string): boolean {
    for (const act of this.accounts) {
      if (act.token === token) return true
    }
    return false
  }

  getUserNameFromToken(token: string): string {
    for (const act of this.accounts) {
      if (act.token === token) return act.name
    }
    return 'anonymous'
  }

  hasReadPermission(token: string, item: ServerItem): boolean {
    const reader = this.getUserNameFromToken(token)
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

  hasWritePermission(token: string, item: ServerItem): boolean {
    if (!this.hasReadPermission(token, item)) return false
    const writer = this.getUserNameFromToken(token)
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

export { AuthManager }
