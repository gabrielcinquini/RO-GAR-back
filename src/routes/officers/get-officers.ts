import { FastifyInstance } from "fastify";
import { db } from "../../lib/prisma";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function getOfficers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/officer', {
    schema: {
      querystring: z.object({
        currentPage: z.coerce.number().optional(),
        itemsPerPage: z.coerce.number().optional(),
      })
    }
  },
  async (request) => {
    const { currentPage, itemsPerPage } = request.query;

    const officers = await db.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        internalRole: true,
        createdAt: true,
        reports: {
          select: {
            report: {
              select: {
                reportNumber: true,
                title: true,
                createdAt: true,
              }
            }
          },
          orderBy: {
            report: {
              createdAt: 'desc',
            },
          },
          take: 1,
        }
      },
      orderBy: {
        fullName: 'asc',
      },
      take: itemsPerPage ? itemsPerPage : undefined,
      skip: currentPage && itemsPerPage ? (currentPage - 1) * itemsPerPage : undefined,
    });

    const totalOfficers = await db.user.count();

    return {
      data: officers.map(officer => ({
        ...officer,
        lastReport: officer.reports.length > 0 ? officer.reports[0].report : null
      })),
      totalPages: Math.ceil(totalOfficers / Number(itemsPerPage)),
      totalCount: totalOfficers,
    };
  });
}
