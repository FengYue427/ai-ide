import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n'
import { pickApiResponseMessage } from './apiUserMessage'

describe('pickApiResponseMessage', () => {
  const t = createTranslator('en-US')

  it('prefers server message', () => {
    expect(
      pickApiResponseMessage({ message: 'Signed in successfully', messageKey: 'api.auth.loginOk' }, t),
    ).toBe('Signed in successfully')
  })

  it('falls back to client key from messageKey', () => {
    expect(pickApiResponseMessage({ messageKey: 'api.auth.registerOk' }, t)).toBe('Registration successful')
  })
})
