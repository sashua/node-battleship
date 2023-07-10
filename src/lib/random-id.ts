import { randomInt } from 'crypto';
import { MAX_RANDOM_ID } from '../config/index.js';

export const randomId = () => randomInt(MAX_RANDOM_ID);
