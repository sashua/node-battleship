import dotenv from 'dotenv';
import { Player, ShipData } from '../types/game-types.js';

dotenv.config();

export const HTTP_PORT = process.env.HTTP_PORT ? Number(process.env.HTTP_PORT) : 3000;
export const MAX_RANDOM_ID: Player['id'] = 2 ** 48 - 1;
export const BOT_ID: Player['id'] = -1;
export const BOT_MIN_TIMEOUT = 750;
export const BOT_MAX_TIMEOUT = 1500;
export const BOARD_SIZE = 10;
export const SHIPS_KIT: Pick<ShipData, 'length' | 'type'>[] = [
  { length: 4, type: 'huge' },
  { length: 3, type: 'large' },
  { length: 3, type: 'large' },
  { length: 2, type: 'medium' },
  { length: 2, type: 'medium' },
  { length: 2, type: 'medium' },
  { length: 1, type: 'small' },
  { length: 1, type: 'small' },
  { length: 1, type: 'small' },
  { length: 1, type: 'small' },
];
