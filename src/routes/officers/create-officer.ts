import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";
import { NotFoundError } from "../../errors/notfound-error";
import { userHasPermission } from "../../permissions";
import { ForbiddenError } from "../../errors/forbidden-error";
import { PilotRank } from "@prisma/client";
import { hashSync } from "bcryptjs";

export async function createOfficer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/officer', {
    schema: {
      body: z.object({
        fullName: z.string().min(4, 'Mínimo de 3 caracteres'),
        phone: z.string().regex(/^\d{3}-\d{3}$/, 'Formato inválido(123-456)'),
        internalRole: z.nativeEnum(PilotRank),
        password: z.string().min(4, 'Mínimo de 4 caracteres'),
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

    const { fullName, phone, internalRole, password } = request.body

    const officerExists = await db.user.findFirst({ where: { phone } })
    if(officerExists) throw new ConflictError('Oficial já cadastrado')

    await db.user.create({
      data: {
        fullName,
        phone,
        internalRole,
        password: hashSync(password, 10),
      }
    })

    return { success: true, message: 'Oficial cadastrado com sucesso!' }
  })
}
