import { BOARD_SIZE, SHIPS_SET } from '../config/index.js';
import { randomId } from '../lib/random-id.js';
import { Board } from './board.js';
import { AttackResult, AttackStatus, GameStatus, Position } from './interfaces.js';
import { Ship } from './ship.js';

export class Game {
  private _id: number;
  private _ships: [Ship[], Ship[]] = [[], []];
  private _boards: [Board<boolean>, Board<boolean>];
  private _winner?: number;
  private _currentIndex = 0;

  constructor(
    private _players: [number, number] = [0, 1],
    boardSize = BOARD_SIZE
  ) {
    this._id = randomId();
    this._boards = [new Board(boardSize), new Board(boardSize)];
  }

  // ----------------------------------------------------------------
  // Public Getters & Setters
  // ----------------------------------------------------------------
  public get id() {
    return this._id;
  }
  public get players(): [number, number] {
    return [...this._players];
  }
  public get currentPlayer() {
    return this._players[this._currentIndex];
  }
  public get enemyPlayer() {
    return this._players[this._enemyIndex];
  }
  public get currentShips() {
    return this._currentShips;
  }
  public get enemyShips() {
    return this._enemyShips;
  }
  public get winner() {
    return this._winner;
  }
  public get status(): GameStatus {
    if (this._winner) return GameStatus.Finished;
    if (this._currentShips.length && this._enemyShips.length) return GameStatus.Started;
    return GameStatus.Created;
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public placeShips(player: number, ships: Ship[]): void {
    if (this.status === GameStatus.Finished) {
      throw new Error(`Game already finished (game ${this._id}, player ${player})`);
    }
    const index = this._getPlayerIndex(player);
    if (index === -1) {
      throw new Error(`Invalid player (game ${this._id}, player ${player})`);
    }
    if (this._ships[index].length) {
      throw new Error(`Ships already placed (game ${this._id}, player ${player})`);
    }
    this._ships[index] = ships;
    this._currentIndex = Math.random() < 0.5 ? 0 : 1;
  }

  // ----------------------------------------------------------------
  public placeShipsRandomly(player: number, shipsLength = SHIPS_SET): void {
    const tempBoard = new Board<boolean>(this._currentBoard.size);
    const ships = shipsLength.map((length) => {
      const isVertical = Math.random() < 0.5;
      const ship = new Ship({ x: 0, y: 0 }, length, isVertical);
      if (!this._placeShipRandomly(tempBoard, ship)) {
        throw new Error(`Random ship placement failed (game ${this._id}, player ${player})`);
      }
      tempBoard.setValues([...ship.positions, ...ship.aroundPositions], true);
      return ship;
    });
    this.placeShips(player, ships);
  }

  // ----------------------------------------------------------------
  public attack(player: number, position?: Position): AttackResult[] {
    if (player !== this.currentPlayer) return [];
    if (this.status !== GameStatus.Started) {
      throw new Error(`Game hasn't been started yet (game ${this._id}, player ${player})`);
    }
    const pos = position ?? this._enemyBoard.getRandomFreePosition();
    if (!pos) {
      throw new Error(`Random attack failed (game ${this._id}, player ${player})`);
    }
    if (!this._enemyBoard.isFree(pos)) return [];

    let damagedShip = null;
    for (const ship of this._enemyShips) {
      if (ship.getShot(pos)) {
        damagedShip = ship;
        break;
      }
    }

    // miss
    if (!damagedShip) {
      this._enemyBoard.setValue(pos, false);
      this._switchPlayers();
      return [{ currentPlayer: player, status: AttackStatus.Miss, position: pos }];
    }

    // shot
    if (!damagedShip.isDestroyed) {
      this._enemyBoard.setValue(pos, true);
      return [{ currentPlayer: player, status: AttackStatus.Shot, position: pos }];
    }

    // killed
    const deckPos = damagedShip.positions.filter((pos) => this._enemyBoard.isInside(pos));
    const aroundPos = damagedShip.aroundPositions.filter((pos) => this._enemyBoard.isInside(pos));
    deckPos.forEach((pos) => this._enemyBoard.setValue(pos, true));
    aroundPos.forEach((pos) => this._enemyBoard.setValue(pos, false));

    this._decideWinner();
    return [
      ...deckPos.map((pos) => ({
        currentPlayer: player,
        status: AttackStatus.Killed,
        position: pos,
      })),
      ...aroundPos.map((pos) => ({
        currentPlayer: player,
        status: AttackStatus.Miss,
        position: pos,
      })),
    ];
  }

  // ----------------------------------------------------------------
  public surrender(player: number) {
    if (!this._players.includes(player)) {
      throw new Error(`Invalid player (game ${this._id}, player ${player})`);
    }
    this._winner = player === this.currentPlayer ? this.enemyPlayer : this.currentPlayer;
  }

  // ----------------------------------------------------------------
  // Private Getters & Setters
  // ----------------------------------------------------------------
  private get _enemyIndex() {
    return (this._currentIndex + 1) % 2;
  }
  private get _currentShips() {
    return this._ships[this._currentIndex];
  }
  private get _enemyShips() {
    return this._ships[this._enemyIndex];
  }
  private get _currentBoard() {
    return this._boards[this._currentIndex];
  }
  private get _enemyBoard() {
    return this._boards[this._enemyIndex];
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  private _switchPlayers() {
    this._currentIndex = this._enemyIndex;
  }

  private _decideWinner() {
    if (this._enemyShips.every((ship) => ship.isDestroyed)) this._winner = this.currentPlayer;
    if (this._currentShips.every((ship) => ship.isDestroyed)) this._winner = this.enemyPlayer;
  }

  private _placeShipRandomly(board: Board<boolean>, ship: Ship): boolean {
    let position: Position | null;
    while ((position = board.getRandomFreePosition())) {
      ship.position = position;
      if (board.areFree(ship.positions)) return true;
      ship.isVertical = !ship.isVertical;
      if (board.areFree(ship.positions)) return true;
    }
    return false;
  }

  private _getPlayerIndex(player: number) {
    return this._players.findIndex((value) => value === player);
  }
}
