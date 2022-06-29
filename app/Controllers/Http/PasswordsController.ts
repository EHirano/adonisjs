import Mail from '@ioc:Adonis/Addons/Mail'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import TokenExpired from 'App/Exceptions/TokenExpiredException'
import User from 'App/Models/User'
import ForgotPasswordValidator from 'App/Validators/ForgotPasswordValidator'
import ResetPasswordValidator from 'App/Validators/ResetPasswordValidator'
import { randomBytes } from 'crypto'
import { promisify } from 'util'

export default class PasswordsController {
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = await request.validate(ForgotPasswordValidator)
    const user = await User.findByOrFail('email', email)

    const random = await promisify(randomBytes)(24)
    console.log(random)
    const token = random.toString('hex')
    console.log(token)

    await user.related('tokens').updateOrCreate(
      { userId: user.id },
      {
        token,
      }
    )

    const resetPasswordUrlWithToken = `${resetPasswordUrl}?token=${token}`

    await Mail.send((message) => {
      message
        .from('no-reply@roleplay.com')
        .to(email)
        .subject('Roleplay: Recuperação de Senha')
        .htmlView('email/forgotpassword', {
          productName: 'Roleplay',
          name: user.username,
          resetPasswordUrl: resetPasswordUrlWithToken,
        })
    })

    return response.noContent()
  }

  public async resetPassword({ request, response }: HttpContextContract) {
    const { token, password } = await request.validate(ResetPasswordValidator)
    //Since you need to querry a user utilising the provided token, we need to use the Adonis's querry builder
    const userByToken = await User.query()
      .whereHas('tokens', (query) => {
        query.where('token', token)
      })
      .preload('tokens')
      .firstOrFail()

    //verify and throw 410 exception if token is older than 2 hours
    const tokenAge = Math.abs(userByToken.tokens[0].createdAt.diffNow('hours').hours)
    if (tokenAge > 2) throw new TokenExpired()

    userByToken.password = password
    await userByToken.save()
    //remove used token - it should be used the .preload property so that it the load is explicit
    await userByToken.tokens[0].delete()

    return response.noContent()
  }
}
