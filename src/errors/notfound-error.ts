const NotFoundErrorMessages = {
  NOT_FOUND: 'Não encontrado',
  USER_NOT_FOUND: 'Usuário não encontrado',
  CREDENTIALS_NOT_FOUND: 'Credenciais não encontradas',
  SESSION_NOT_FOUND: 'Sessão não encontrada',
} as const

type NotFoundErrorMessages = typeof NotFoundErrorMessages[keyof typeof NotFoundErrorMessages];

export class NotFoundError extends Error {
  constructor(message: NotFoundErrorMessages) {
    super(message)
    this.name = 'NotFoundError'
  }
}