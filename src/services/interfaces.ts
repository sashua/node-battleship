import { Position } from '../core/interfaces.js';

export interface Player {
  id: number;
  name: string;
  password: string;
  wins: number;
}

export type LoginDto = Pick<Player, 'name' | 'password'>;

export interface Room {
  id: number;
  playerId: Player['id'];
  playerName: Player['name'];
}

export interface ShipDto {
  position: Position;
  direction: boolean;
  length: number;
  type: string;
}
