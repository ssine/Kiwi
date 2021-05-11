export class KiwiError extends Error {
  code = 1
  constructor(message?: string) {
    super(message)
    /**
     * Get xx instanceof xxError work in typescript
     * @see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
     * @see https://github.com/reduardo7/ts-base-error/blob/master/src/index.ts
     */
    const trueProto = new.target.prototype
    Object.setPrototypeOf(this, trueProto)
  }
}

const codeErrorMap: Record<number, typeof KiwiError> = {}

export const constructErrorFromCode = (code: number, message: string): KiwiError => {
  return new codeErrorMap[code](message)
}

const register = (error: typeof KiwiError) => {
  codeErrorMap[new error().code] = error
}

@register
export class ItemNotExistsError extends KiwiError {
  code = 2
}

@register
export class NoReadPermissionError extends KiwiError {
  code = 3
}

@register
export class NoWritePermissionError extends KiwiError {
  code = 4
}

@register
export class UserNotExistsError extends KiwiError {
  message = 'User not exists'
  code = 5
}

@register
export class PasswordIncorrectError extends KiwiError {
  message = 'Password incorrect'
  code = 6
}

@register
export class UploadFileError extends KiwiError {
  code = 7
}

@register
export class InvalidURIError extends KiwiError {
  code = 8
}
