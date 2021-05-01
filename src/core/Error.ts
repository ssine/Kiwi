export class KiwiError extends Error {
  code = 0
}

export class ItemNotExistsError extends KiwiError {
  code = 1
}

export class NoReadPermissionError extends KiwiError {
  code = 2
}

export class NoWritePermissionError extends KiwiError {
  code = 3
}

export class UserNotExistsError extends KiwiError {
  code = 4
}

export class PasswordIncorrectError extends KiwiError {
  code = 5
}
