const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  const secret = process.env.FIELD_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('FIELD_ENCRYPTION_KEY is not set — required to encrypt/decrypt sensitive fields.');
  }
  // Derive a 32-byte key from the secret (works regardless of secret length)
  return crypto.createHash('sha256').update(secret).digest();
};

// Encrypts a plaintext string. Returns "iv:authTag:ciphertext" (all hex).
const encryptField = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === '') return plainText;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

// Decrypts a string produced by encryptField.
const decryptField = (payload) => {
  if (!payload || typeof payload !== 'string' || !payload.includes(':')) return payload;

  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) return payload;

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);

  return decrypted.toString('utf8');
};

module.exports = { encryptField, decryptField };
