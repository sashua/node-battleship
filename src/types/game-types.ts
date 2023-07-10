export interface Player {
  id: number;
  name: string;
  password: string;
  wins: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface ShipData {
  position: Position;
  direction: boolean;
  length: 1 | 2 | 3 | 4;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export type AttackStatus = 'miss' | 'shot' | 'killed';

export enum GameState {
  RoomOpened,
  GameCreated,
  GameStarted,
  GameFinished,
}
