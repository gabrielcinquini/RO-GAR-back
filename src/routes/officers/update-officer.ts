import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";
import { PilotRank } from "@prisma/client";
import { NotFoundError } from "../../errors/notfound-error";
import { ForbiddenError } from "../../errors/forbidden-error";
import { userHasPermission } from "../../permissions";

export async function updateOfficer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch('/officer/:currentOfficerPhone', {
    schema: {
      params: z.object({
        currentOfficerPhone: z.string().regex(/^\d{3}-\d{3}$/, 'Formato inválido(123-456)'),
      }),
      body: z.object({
        fullName: z.string().min(4, 'Mínimo de 3 caracteres'),
        phone: z.string().regex(/^\d{3}-\d{3}$/, 'Formato inválido(123-456)'),
        internalRole: z.nativeEnum(PilotRank),
        password: z.string().optional(),  // Senha agora é opcional
      }),
      headers: z.object({
        authorization: z.string(),
      })
    }
  },
  async (request) => {
    const { authorization } = request.headers;
    const currentUser = await getUserFromAuthorization(authorization);

    if (!currentUser) throw new NotFoundError('Usuário não encontrado');

    const { currentOfficerPhone } = request.params;
    const isCurrentUserEditingItSelf = currentUser.phone === currentOfficerPhone;
    const { fullName, phone, internalRole, password } = request.body;

    const user = await db.user.findUnique({
      where: { phone: currentOfficerPhone },
    });

    if (!user) throw new ConflictError('Oficial não encontrado');

    const canEditOthers = userHasPermission(currentUser, 'SUB_COMMAND');
    
    if (!isCurrentUserEditingItSelf && (!canEditOthers || password)) throw new ForbiddenError('Você não tem permissão para acessar este recurso');
    if (internalRole && !canEditOthers && internalRole !== currentUser.internalRole) throw new ForbiddenError('Você não tem permissão para acessar este recurso');

    await db.user.update({
      where: { phone: currentOfficerPhone },
      data: {
        fullName,
        phone,
        internalRole: internalRole ?? user.internalRole,
        ...(isCurrentUserEditingItSelf && password ? { password } : {}),
      },
    });

    return { success: true, message: 'Oficial atualizado com sucesso!' };
  });
}
