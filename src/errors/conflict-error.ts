const ConflictErrorMessages = {
  CONFLICT: 'Conflito',

  REPORT_ALREADY_EXISTS: 'R.O já existe',
  REPORT_NOT_FOUND: 'R.O não encontrado',

  OFFICER_ALREADY_REGISTERED: 'Oficial já cadastrado',
  OFFICER_NOT_FOUND: 'Oficial não encontrado',
} as const

type ConflictErrorMessages = typeof ConflictErrorMessages[keyof typeof ConflictErrorMessages];

export class ConflictError extends Error {
  constructor(message: ConflictErrorMessages) {
    super(message)
    this.name = 'ConflictError'
  }
}