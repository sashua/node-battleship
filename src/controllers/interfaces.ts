import { AttackStatus, Position } from '../core/interfaces.js';
import { ShipDto } from '../services/interfaces.js';

export interface LoginPayload {
  name: string;
  password: string;
}

export interface LoginResultPayload {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface UpdateWinnersPayload {
  [index: number]: { name: string; winds: number };
}

export type CreateRoomPayload = '';

export interface AddUserToRoomPayload {
  indexRoom: number;
}

export interface CreateGamePayload {
  idGame: number;
  idPlayer: number;
}

export interface UpdateRoomPayload {
  [index: number]: {
    roomId: number;
    roomUsers: { name: string; index: number }[];
  };
}

export interface AddShipsPayload {
  gameId: number;
  ships: ShipDto[];
  indexPlayer: number;
}

export interface StartGamePayload {
  ships: ShipDto[];
  currentPlayerIndex: number;
}

export interface AttackPayload {
  gameId: number;
  x: Position['x'];
  y: Position['y'];
  indexPlayer: number;
}

export interface AttackResultPayload {
  position: Position;
  currentPlayer: number;
  status: AttackStatus;
}

export interface RandomAttackPayload {
  gameId: number;
  indexPlayer: number;
}

export interface TurnPayload {
  currentPlayer: number;
}

export interface FinishPayload {
  winPlayer: number;
}
