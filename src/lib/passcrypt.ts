import { createHash } from 'crypto';

export const hash = (pwd: string) => createHash('sha256').update(pwd).digest('hex');

export const compare = (pwd: string, pwdHash: string) => hash(pwd) === pwdHash;
