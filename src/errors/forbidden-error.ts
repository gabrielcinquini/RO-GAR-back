const ForbiddenErrorMessages = {
  FORBIDDEN: 'Forbidden',
  ACCESS_DENIED: 'Você não tem permissão para acessar este recurso',
} as const

type ForbiddenErrorMessages = typeof ForbiddenErrorMessages[keyof typeof ForbiddenErrorMessages];

export class ForbiddenError extends Error {
  constructor(message: ForbiddenErrorMessages) {
    super(message)
    this.name = 'ForbiddenError'
  }
}