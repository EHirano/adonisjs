import Mail from '@ioc:Adonis/Addons/Mail'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import { randomBytes } from 'crypto'
import { promisify } from 'util'

// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class PasswordsController {
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = request.only(['email', 'resetPasswordUrl'])
    const user = await User.findByOrFail('email', email)

    //creates a random token
    function createResetToken() {
      return randomBytes(20).toString('hex')
    }
    const token = createResetToken()
    await user.related('tokens').updateOrCreate({ userId: user.id }, { token })

    const resetPasswordUrlWithToken = `${resetPasswordUrl}?=token=${token}`

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
}
