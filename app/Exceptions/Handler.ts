import { Exception } from '@adonisjs/core/build/standalone'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from '@ioc:Adonis/Core/Logger'

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor() {
    super(Logger)
  }

  public async handle(error: Exception, ctx: HttpContextContract) {
    console.log({ error })
    if (error.status === 422)
      return ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        message: error.message,
        status: error.status,
        errors: error['messages']?.errors ? error['messages'].error : '',
      })
    else if (error.code === 'E_ROW_NOT_FOUND')
      return ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        message: 'resource not found',
        status: 404,
      })
    else if (error.code === 'E_VALIDATION_FAILURE')
      return ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        message: 'Token has expired',
        status: 422,
      })
    else if (['E_INVALID_AUTH_UID', 'E_INVALID_AUTH_PASSWORD'].includes(error.code || ''))
      return ctx.response.status(error.status).send({
        code: 'BAD_REQUEST',
        message: 'invalid credentials',
        status: 400,
      })
    return super.handle(error, ctx)
  }
}
