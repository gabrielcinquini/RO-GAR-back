import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";

export async function createReport(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/report', {
    schema: {
      body: z.object({
        reportNumber: z.coerce.number().int().positive('O número do relatório deve ser positivo'),
        title: z.string().min(4, 'Mínimo de 4 caracteres'),
        description: z.string().min(4, 'Mínimo de 4 caracteres'),
        officersEnvolved: z.array(
          z.object({
            id: z.string(),
            fullName: z.string(),
          })
        ),
      }),
      headers: z.object({
        authorization: z.string(),
      })
    }
  },
  async (request) => {
    const { authorization } = request.headers

    const currentUser = await getUserFromAuthorization(authorization)

    if(!currentUser) return { success: false, message: 'Usuário não encontrado' }

    const { reportNumber, title, description, officersEnvolved } = request.body

    const reportAlreadyExists = await db.report.findFirst({
      where: { reportNumber }
    })

    if(reportAlreadyExists) throw new ConflictError('R.O já existe')

    await db.report.create({
      data: {
        reportNumber: reportNumber,
        title,
        description,
        users: {
          create: officersEnvolved.map((officer) => ({
            user: { connect: { id: officer.id } }
          }))
        }
      }
    });

    return { success: true, message: 'R.O criado com sucesso!' }
  })
}
