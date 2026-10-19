import crypto, { randomBytes } from 'crypto'

export function pbkdf2Async(key: string, salt: string, iterations: number = 100000, keylen: number = 64, digest: string = 'sha512') {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(key, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err)
        reject(err)
      return resolve(derivedKey)
    })
  })
}

export const generateKeySaltCombo = async () => {
  const salt = randomBytes(16).toString('hex')
  const key = randomBytes(48).toString('hex')
  const hash = (await pbkdf2Async(key, salt)).toString('hex')

  return { key, salt, hash }
}
