import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";
import { userHasPermission } from "../../permissions";
import { NotFoundError } from "../../errors/notfound-error";
import { ForbiddenError } from "../../errors/forbidden-error";

export async function deleteOfficer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete('/officer/:officerPhoneNumber', {
    schema: {
      params: z.object({
        officerPhoneNumber: z.string().regex(/^\d{3}-\d{3}$/, 'Formato inválido(123-456)'),
      }),
      headers: z.object({
        authorization: z.string(),
      })
    }
  },
  async (request) => {
    const { authorization } = request.headers

    const currentUser = await getUserFromAuthorization(authorization)
    if(!currentUser) throw new NotFoundError('Usuário não encontrado')

    const isSubCommandOrGreater = userHasPermission(currentUser, 'SUB_COMMAND')
    if(!isSubCommandOrGreater) throw new ForbiddenError('Você não tem permissão para acessar este recurso')

    const { officerPhoneNumber } = request.params

    const officerExists = await db.user.findUnique({
      where: { phone: officerPhoneNumber }
    })

    if(!officerExists) throw new ConflictError('Oficial não encontrado')

    await db.user.delete({
      where: { phone: officerPhoneNumber }
    })

    return { success: true, message: 'Oficial deletado com sucesso!' }
  })
}
