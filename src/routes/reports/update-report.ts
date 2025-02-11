import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { getUserFromAuthorization } from "../../utils";
import { ConflictError } from "../../errors/conflict-error";

export async function updateReport(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().patch('/report/:reportNumber', {
    schema: {
      params: z.object({
        reportNumber: z.coerce.number().int().positive('O número do relatório deve ser positivo'),
      }),
      body: z.object({
        reportNumber: z.coerce.number().int().optional(),
        title: z.string().min(4, 'Mínimo de 4 caracteres'),
        description: z.string().min(4, 'Mínimo de 4 caracteres'),
        officersEnvolved: z.array(
          z.object({
            id: z.string(),
            fullName: z.string(),
          })
        ),
        createdAt: z.coerce.date().optional(),
      }),
      headers: z.object({
        authorization: z.string(),
      })
    }
  },
  async (request) => {
    const { authorization } = request.headers;
    const currentUser = await getUserFromAuthorization(authorization);

    if (!currentUser) return { success: false, message: 'Usuário não encontrado' };

    const { reportNumber } = request.params;
    const { title, description, officersEnvolved, reportNumber: newReportNumber } = request.body;

    const report = await db.report.findUnique({
      where: { reportNumber },
      include: { users: true },
    });

    if (!report) {
      return { success: false, message: 'Relatório não encontrado' };
    }

    const reportId = report.id;

    if (newReportNumber && newReportNumber !== reportNumber) {
      const existingReport = await db.report.findUnique({
        where: { reportNumber: newReportNumber },
      });

      if (existingReport) throw new ConflictError('R.O já existe');
    }

    const currentOfficers = report.users.map(userReport => userReport.userId);
    const newOfficers = officersEnvolved.map(officer => officer.id);

    const officersToRemove = currentOfficers.filter(id => !newOfficers.includes(id));
    const officersToAdd = newOfficers.filter(id => !currentOfficers.includes(id));

    await db.$transaction(async (prisma) => {
      if (officersToRemove.length > 0) {
        await prisma.userReport.deleteMany({
          where: {
            reportId,
            userId: { in: officersToRemove },
          },
        });
      }

      if (officersToAdd.length > 0) {
        await prisma.userReport.createMany({
          data: officersToAdd.map((officerId) => ({
            reportId,
            userId: officerId,
          })),
        });
      }
    });

    await db.report.update({
      where: {
        reportNumber,
      },
      data: {
        title,
        description,
      },
    });

    return { success: true, message: 'R.O atualizado com sucesso!' };
  });
}
