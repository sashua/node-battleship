import { BOT_ID } from '../config/index.js';
import { Game } from '../core/game.js';
import { GameStatus, Position } from '../core/interfaces.js';
import { Ship } from '../core/ship.js';
import { InmemoryDB } from '../db/inmemory-db.js';
import * as passcrypt from '../lib/passcrypt.js';
import { randomId } from '../lib/random-id.js';
import { LoginDto, Player, Room, ShipDto } from './interfaces.js';

interface Dependencies {
  playersDB: InmemoryDB<Player>;
  roomsDB: InmemoryDB<Room>;
}

export class GameService {
  private _playersDB: InmemoryDB<Player>;
  private _roomsDB: InmemoryDB<Room>;
  private _games = new Map<Game['id'], Game>();

  constructor({ playersDB, roomsDB }: Dependencies) {
    this._playersDB = playersDB;
    this._roomsDB = roomsDB;
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public login(newId: Player['id'], dto: LoginDto): Player {
    const player = this._playersDB.findFirst('name', dto.name);
    if (!player) {
      return this._playersDB.create({
        id: newId,
        name: dto.name,
        password: passcrypt.hash(dto.password),
        wins: 0,
      });
    }
    if (!passcrypt.compare(dto.password, player.password)) {
      throw new Error('Invalid password');
    }
    this._playersDB.update(player.id, { id: newId });
    return player;
  }

  // ----------------------------------------------------------------
  public logout(playerId: Player['id']) {
    const rooms = this._roomsDB.findMany('playerId', playerId);
    const closedRooms = rooms.map((room) => this._roomsDB.delete(room.id));

    const closedGames: Game[] = [];
    for (const game of this._games.values()) {
      if (game.players.includes(playerId)) {
        game.surrender(playerId);
        this._closeFinishedGame(game);
        closedGames.push(game);
      }
    }

    return { closedRooms, closedGames };
  }

  // ----------------------------------------------------------------
  public startSingeplayer(playerId: Player['id']): Game {
    const player = this._playersDB.find(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    const roomsToDelete = this._roomsDB.findMany('playerId', playerId);
    roomsToDelete.forEach(({ id }) => this._roomsDB.delete(id));

    const game = new Game([BOT_ID, playerId]);
    this._games.set(game.id, game);
    game.placeShipsRandomly(BOT_ID);
    return game;
  }

  // ----------------------------------------------------------------
  public createRoom(playerId: Player['id']): Room {
    const player = this._playersDB.find(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    if (this._roomsDB.findFirst('playerId', playerId)) {
      throw new Error('Room already created');
    }
    return this._roomsDB.create({
      id: randomId(),
      playerId: player.id,
      playerName: player.name,
    });
  }

  // ----------------------------------------------------------------
  public joinRoom(roomId: Room['id'], playerId: Player['id']): Game | null {
    const room = this._roomsDB.find(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.playerId === playerId) return null;
    const player = this._playersDB.find(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    this._roomsDB.delete(roomId);
    const roomsToDelete = this._roomsDB.findMany('playerId', playerId);
    roomsToDelete.forEach(({ id }) => this._roomsDB.delete(id));

    const game = new Game([room.playerId, playerId]);
    this._games.set(game.id, game);
    return game;
  }

  // ----------------------------------------------------------------
  public addShips(gameId: Game['id'], playerId: Player['id'], shipsDto: ShipDto[]): Game | null {
    const game = this._games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    game.placeShips(
      playerId,
      shipsDto.map(({ position, length, direction }) => new Ship(position, length, direction))
    );
    return game.status === GameStatus.Started ? game : null;
  }

  // ----------------------------------------------------------------
  public attack(gameId: Game['id'], playerId: Player['id'], position?: Position) {
    const game = this._games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    const results = game.attack(playerId, position);

    if (game.status === GameStatus.Finished) {
      this._closeFinishedGame(game);
    }

    return { game, results };
  }

  // ----------------------------------------------------------------
  // Public Helper Methods
  // ----------------------------------------------------------------
  public getWinners() {
    return Array.from(this._playersDB.findAll())
      .filter((player) => player.wins)
      .sort((a, b) => b.wins - a.wins);
  }

  public getRooms() {
    return Array.from(this._roomsDB.findAll());
  }

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------
  private _closeFinishedGame(game: Game): boolean {
    if (!game.winner) return false;
    this._games.delete(game.id);
    if (game.winner === BOT_ID) return true;
    const winner = this._playersDB.find(game.winner);
    this._playersDB.update(game.winner, winner ? { wins: winner.wins + 1 } : {});
    return true;
  }
}
