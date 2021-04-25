/**
 * Management of users
 * @packageDocumentation
 */
import { createHash } from 'crypto'

interface UserAccount {
  name: string
  password: string
  token: string
}

type LoginResult =
  | {
      success: false
      reason: string
    }
  | {
      success: true
      token: string
    }

class UserManager {
  accounts: UserAccount[]
  constructor() {
    this.accounts = []
  }

  /**
   * Initialize User Manager with stored json data string
   */
  init(dataContent: string) {
    const data: UserAccount[] = JSON.parse(dataContent)
    this.accounts = data
      .filter(act => act.name && act.password)
      .map(act => {
        act.token = createHash('sha256')
          .update(act.name + act.password)
          .digest('hex')
        return act
      })
  }

  login(name: string, password: string): LoginResult {
    for (const act of this.accounts) {
      if (act.name === name) {
        if (act.password !== password)
          return {
            success: false,
            reason: 'password incorrect',
          }
        return {
          success: true,
          token: act.token,
        }
      }
    }
    return {
      success: false,
      reason: 'account not exist',
    }
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
    return ''
  }
}

export { UserManager }
