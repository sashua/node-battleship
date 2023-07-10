import dotenv from 'dotenv';

dotenv.config();

export const HTTP_PORT = process.env.HTTP_PORT ? Number(process.env.HTTP_PORT) : 3000;
export const MAX_RANDOM_ID = 2 ** 48 - 1;
export const BOT_ID = -1;
export const BOT_MIN_TIMEOUT = 750;
export const BOT_MAX_TIMEOUT = 1500;
export const BOARD_SIZE = 10;
export const SHIPS_SET = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
