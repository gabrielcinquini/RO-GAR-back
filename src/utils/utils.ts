import jsonwebtoken from 'jsonwebtoken'
import { db } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getUserFromAuthorization(authorization: string) {
  try {
    const user = jsonwebtoken.verify(authorization.replace('Bearer ', ''), process.env.JWT_SECRET) as { id: string }

    const userFromDatabase = await db.user.findUniqueOrThrow({
      where: {
        id: user.id
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        internalRole: true,
      }
    })
    
    return userFromDatabase
  } catch (error) {
    throw new ClientError('Token inválido ou Usuário não encontrado')
  }
}