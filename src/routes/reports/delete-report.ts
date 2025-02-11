import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";
import { userHasPermission } from "../../permissions";
import { NotFoundError } from "../../errors/notfound-error";
import { ForbiddenError } from "../../errors/forbidden-error";

export async function deleteReport(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete('/report/:reportNumber', {
    schema: {
      params: z.object({
        reportNumber: z.coerce.number(),
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

    const isSeniorOrGreater = userHasPermission(currentUser, 'SUB_COMMAND')
    if(!isSeniorOrGreater) throw new ForbiddenError('Você não tem permissão para acessar este recurso')

    const { reportNumber } = request.params

    const reportExists = await db.report.findFirst({
      where: { reportNumber }
    })

    if(!reportExists) throw new ConflictError('R.O não encontrado')

    await db.report.delete({
      where: { reportNumber }
    })

    return { success: true, message: 'R.O deletado com sucesso!' }
  })
}
