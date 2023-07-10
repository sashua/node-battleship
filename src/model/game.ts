import { randomInt } from 'crypto';
import { BOARD_SIZE, BOT_ID, MAX_RANDOM_ID, SHIPS_KIT } from '../config/index.js';
import { AttackStatus, GameState, Player, Position, ShipData } from '../types/game-types.js';
import { AttackResultPayload } from '../types/message-types.js';
import { Board } from './board.js';
import { Ship } from './ship.js';

export class Game {
  private _id = randomInt(MAX_RANDOM_ID);
  private _players: Player['id'][];
  private _currentPlayer: Player['id'];
  private _winner: Player['id'] | null = null;
  private _state: GameState;
  private _ships = new Map<Player['id'], Ship[]>();
  private _boards = new Map<Player['id'], Board>();

  constructor(playerId: Player['id']) {
    this._players = [playerId];
    this._currentPlayer = playerId;
    this._state = GameState.RoomOpened;
  }

  // ----------------------------------------------------------------
  // Getters
  // ----------------------------------------------------------------
  public get id() {
    return this._id;
  }

  public get state() {
    return this._state;
  }

  public get isPvP() {
    return !this._players.includes(BOT_ID);
  }

  public get players() {
    return this._players.filter((playerId) => playerId !== BOT_ID);
  }

  public get currentPlayer() {
    return this._currentPlayer;
  }

  public get winner() {
    return this._winner;
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public addBot() {
    if (this._state !== GameState.RoomOpened || this._players.length >= 2) {
      return;
    }
    this._players.push(BOT_ID);
    const ships = this.getRandomlyPlacedShips(SHIPS_KIT, BOARD_SIZE);
    this._ships.set(BOT_ID, ships);
    this._boards.set(BOT_ID, new Board(BOARD_SIZE));
    this._state = GameState.GameCreated;
  }

  // ----------------------------------------------------------------
  public addPlayer(playerId: Player['id']) {
    if (
      this._state !== GameState.RoomOpened ||
      this._players.length >= 2 ||
      this.validPlayer(playerId)
    ) {
      return;
    }
    this._players.push(playerId);
    this._state = GameState.GameCreated;
  }

  // ----------------------------------------------------------------
  public addShips(playerId: Player['id'], ships: ShipData[]) {
    if (this.state !== GameState.GameCreated || !this.validPlayer(playerId)) {
      return;
    }
    this._ships.set(
      playerId,
      ships.map(
        ({ position, direction, length, type }) => new Ship(position, direction, length, type)
      )
    );
    this._boards.set(playerId, new Board(BOARD_SIZE));
    if (this._ships.size < 2) {
      return;
    }
    this._currentPlayer = this._players[randomInt(this._players.length)];
    this._state = GameState.GameStarted;
  }

  // ----------------------------------------------------------------
  public getPlayerShips(playerId: Player['id']) {
    const ships: ShipData[] = [];
    this._ships.get(playerId)?.forEach((ship) => ships.push(ship.shipData));
    return ships;
  }

  // ----------------------------------------------------------------
  public getRandomAttackPosition(playerId: Player['id']) {
    const enemyBoard = this._boards.get(this.getEnemy(playerId));
    return enemyBoard?.getRandomFreePosition() ?? null;
  }

  // ----------------------------------------------------------------
  public attack(playerId: Player['id'], position: Position): AttackResultPayload[] {
    if (this.state !== GameState.GameStarted || this._currentPlayer !== playerId) {
      return [];
    }

    const enemyPlayer = this.getEnemy(playerId);
    const enemyShips = this._ships.get(enemyPlayer);
    const enemyBoard = this._boards.get(enemyPlayer);
    if (!enemyShips || !enemyBoard || !enemyBoard.isFree(position)) {
      return [];
    }
    const damagedShip = this.getDamagedShip(enemyShips, position);

    // miss
    if (!damagedShip) {
      this.switchPlayer();
      enemyBoard.setValue(position, 'miss');
      return [this.createAttackResultPayload('miss', position, playerId)];
    }

    // shot
    if (!damagedShip.killed) {
      enemyBoard.setValue(position, 'shot');
      return [this.createAttackResultPayload('shot', position, playerId)];
    }

    // killed
    this.decideWinner(playerId, enemyShips);

    const deckPositions = damagedShip.deckPositions.filter((position) =>
      enemyBoard.isValid(position)
    );
    const aroundPositions = damagedShip.aroundPositions.filter((position) =>
      enemyBoard.isValid(position)
    );
    deckPositions.forEach((position) => enemyBoard.setValue(position, 'killed'));
    aroundPositions.forEach((position) => enemyBoard.setValue(position, 'miss'));

    return [
      ...deckPositions.map((position) =>
        this.createAttackResultPayload('killed', position, playerId)
      ),
      ...aroundPositions.map((position) =>
        this.createAttackResultPayload('miss', position, playerId)
      ),
    ];
  }

  // ----------------------------------------------------------------
  public validPlayer(playerId: Player['id']) {
    return this._players.includes(playerId);
  }

  // ----------------------------------------------------------------
  public getEnemy(currentPlayer: Player['id']) {
    return this._players[0] === currentPlayer ? this._players[1] : this._players[0];
  }

  // ----------------------------------------------------------------
  // Private Methods
  // ----------------------------------------------------------------
  private switchPlayer() {
    this._currentPlayer = this.getEnemy(this._currentPlayer);
  }

  // ----------------------------------------------------------------
  private decideWinner(currentPlayer: Player['id'], enemyShips: Ship[]) {
    if (enemyShips.every((ship) => ship.killed)) {
      this._winner = currentPlayer;
      this._state = GameState.GameFinished;
    }
  }

  // ----------------------------------------------------------------
  private getDamagedShip(enemyShips: Ship[], position: Position) {
    for (const ship of enemyShips) {
      if (ship.getShot(position)) {
        return ship;
      }
    }
    return null;
  }

  // ----------------------------------------------------------------
  private getRandomlyPlacedShips(shipsKit: Pick<ShipData, 'length' | 'type'>[], boardSize: number) {
    const board = new Board(boardSize);
    return shipsKit.map(({ length, type }) => {
      const ship = new Ship({ x: board.size, y: board.size }, Math.random() < 0.5, length, type);
      this.placeShipRandomly(board, ship);
      board.setValues([...ship.deckPositions, ...ship.aroundPositions], 'miss');
      return ship;
    });
  }

  private placeShipRandomly(board: Board, ship: Ship) {
    let position: Position | null;
    while ((position = board.getRandomFreePosition())) {
      ship.position = position;
      if (ship.deckPositions.every((position) => board.isFree(position))) return true;
      ship.direction = !ship.direction;
      if (ship.deckPositions.every((position) => board.isFree(position))) return true;
    }
    return false;
  }

  // ----------------------------------------------------------------
  private createAttackResultPayload(
    status: AttackStatus,
    position: Position,
    currentPlayer: Player['id']
  ): AttackResultPayload {
    return { status, position, currentPlayer };
  }
}
