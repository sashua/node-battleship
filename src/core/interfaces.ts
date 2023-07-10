export interface Position {
  x: number;
  y: number;
}

export enum GameStatus {
  Created,
  Started,
  Finished,
}

export enum AttackStatus {
  Miss = 'miss',
  Shot = 'shot',
  Killed = 'killed',
}

export interface AttackResult {
  currentPlayer: number;
  status: AttackStatus;
  position: Position;
}
