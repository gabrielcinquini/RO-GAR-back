import { FastifyInstance } from "fastify";
import { db } from "../../lib/prisma";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export async function getReports(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/report', {
    schema: {
      querystring: z.object({
        reportNumber: z.coerce.number().int().positive('O id do relatório deve ser positivo').optional(),
        officerId: z.union([z.string(), z.literal('all')]).optional(),
        currentPage: z.coerce.number().optional(),
        itemsPerPage: z.coerce.number().optional(),
      })
    }
  },
  async (request) => {
    const { currentPage, itemsPerPage, reportNumber, officerId } = request.query;

    const whereClause = {
      ...(reportNumber && { reportNumber }),
      ...(officerId && officerId !== 'all' && { 
        users: {
          some: {
            userId: officerId,
          },
        },
      }),
    };
  
    const reports = await db.report.findMany({
      where: whereClause,
      select: {
        reportNumber: true,
        title: true,
        description: true,
        users: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
              }
            }
          },
          orderBy: {
            user: {
              fullName: 'asc',
            }
          }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: itemsPerPage ? itemsPerPage : undefined,
      skip: currentPage && itemsPerPage ? (currentPage - 1) * itemsPerPage : undefined,
    });

    const totalReports = await db.report.count({
      where: whereClause,
    })
  
    const result = reports.map(report => ({
      ...report,
      officersEnvolved: report.users.map(user => ({
        id: user.user.id,
        fullName: user.user.fullName,
      })),
    }));
  
    return {
      data: result,
      totalPages: Math.ceil(totalReports / Number(itemsPerPage)),
      totalCount: totalReports,
    };
  }
)};
