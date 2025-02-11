import fastify from 'fastify'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { errorHandler } from './error-handler'
import { signIn } from './routes/auth'
import { getOfficers, createOfficer, updateOfficer, deleteOfficer } from './routes/officers'
import { getReports, createReport, updateReport, deleteReport } from './routes/reports'

const app = fastify()

app.register(cors, {
  origin: '*',
  credentials: true,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.register(signIn)

app.register(getOfficers)
app.register(createOfficer)
app.register(updateOfficer)
app.register(deleteOfficer)

app.register(getReports)
app.register(createReport)
app.register(updateReport)
app.register(deleteReport)


app.listen({ port: process.env.PORT }).then(() => {
  console.log(`server running`)
})
