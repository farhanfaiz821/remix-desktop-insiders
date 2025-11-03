import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashDeviceFingerprint = (fingerprint: string): string => {
  return crypto
    .createHmac('sha256', env.SERVER_SALT)
    .update(fingerprint)
    .digest('hex');
};

export const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
