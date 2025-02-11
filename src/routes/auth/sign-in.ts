import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { db } from "../../lib/prisma";
import { compareSync } from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { ClientError } from "../../errors/client-error";
import { NotFoundError } from "../../errors/notfound-error";

export async function signIn(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/auth/sign-in', {
    schema: {
      body: z.object({
        phone: z.string().regex(/^\d{3}-\d{3}$/, 'Formato inválido(123-456)'),
        password: z.string().min(4, 'Mínimo de 4 caracteres'),
      })
    }
  },
  async (request) => {
    const { phone, password } = request.body

    const user = await db.user.findUnique({
      where: {
        phone,
      },
    })

    if (!password) {
      throw new ClientError('Senha não informada')
    }

    if (!user || !compareSync(password as string, user.password!)) {
      throw new NotFoundError('Credenciais não encontradas')
    }

    if (user) {
      const token = jsonwebtoken.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      })
      
      return { user: { ...user, password: undefined }, token }
    } else {
      return null
    }
  })
}
