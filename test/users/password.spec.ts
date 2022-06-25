import Mail from '@ioc:Adonis/Addons/Mail'
import Database from '@ioc:Adonis/Lucid/Database'
import test from 'japa'
import supertest from 'supertest'

import { UserFactory } from './../../database/factories/index'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Password', (group) => {
  test('it should send an email with forgot password instructions', async (assert) => {
    const user = await UserFactory.create()

    const mailer = Mail.fake(['smtp'])

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    const message = mailer.find((mail) => {
      return mail.to![0].address === user.email
    })

    assert.isTrue(
      mailer.exists((mail) => {
        return mail.subject === 'Roleplay: Recuperação de Senha'
      })
    )

    assert.deepEqual(message?.from, { address: 'no-reply@roleplay.com', name: '' })

    assert.deepEqual(message?.to, [
      {
        address: user.email,
        name: '',
      },
    ])

    assert.include(message!.html!, user.username)

    Mail.restore()
  })

  test.only('it should create a reset password token', async (assert) => {
    const user = await UserFactory.create()

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    const tokens = await user.related('tokens').query()
    console.log({ tokens })
    assert.isNotEmpty(tokens)
  })

  test.only('it should return 422 when required data is not provided or data is invalid', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/forgot-password').send({}).expect(402)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
