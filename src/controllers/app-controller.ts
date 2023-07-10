import { randomInt } from 'crypto';
import { BOT_ID, BOT_MAX_TIMEOUT, BOT_MIN_TIMEOUT } from '../config/index.js';
import { Game } from '../core/game.js';
import { GameStatus } from '../core/interfaces.js';
import { Ship } from '../core/ship.js';
import { WsContext, WsController, WsMessage } from '../servers/interfaces.js';
import { GameService } from '../services/game-service.js';
import { ShipDto } from '../services/interfaces.js';
import {
  AddShipsPayload,
  AddUserToRoomPayload,
  AttackPayload,
  LoginPayload,
} from './interfaces.js';
import {
  attackResultMessages,
  createGameMessage,
  finishMessage,
  regMessage,
  startGameMessage,
  turnMessage,
  updateRoomMessage,
  updateWinnersMessage,
} from './message-factory.js';

interface Dependencies {
  gameService: GameService;
}

export class AppController implements WsController {
  private _gameService: GameService;
  private validTypes: (keyof this)[] = [
    'reg',
    'single_play',
    'create_room',
    'add_user_to_room',
    'add_ships',
    'attack',
    'randomAttack',
  ];

  constructor({ gameService }: Dependencies) {
    this._gameService = gameService;
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public onClientMessage = ({ type, data }: WsMessage, ctx: WsContext) => {
    const isValidType = (this.validTypes as string[]).includes(type);
    if (!isValidType) {
      throw new Error(`Invalid message type: ${type}`);
    }
    this[type as keyof this](data, ctx);
  };

  public onClientClose = (ctx: WsContext) => {
    const { roomsCount, gamesCount } = this._gameService.logout(ctx.id);
    if (roomsCount) {
      const rooms = this._gameService.getRooms();
      ctx.broadcast(updateRoomMessage(rooms));
    }
    if (gamesCount) {
      const winners = this._gameService.getWinners();
      ctx.send(updateWinnersMessage(winners));
    }
  };

  // ----------------------------------------------------------------
  // Controllers
  // ----------------------------------------------------------------
  public reg(data: unknown, ctx: WsContext) {
    const loginPayload = data as LoginPayload;

    try {
      const player = this._gameService.login(ctx.id, loginPayload);
      ctx.send(regMessage(player));

      const winners = this._gameService.getWinners();
      ctx.send(updateWinnersMessage(winners));

      const rooms = this._gameService.getRooms();
      ctx.send(updateRoomMessage(rooms));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      ctx.send(regMessage({ id: ctx.id, name: loginPayload.name }, message));
    }
  }

  // ----------------------------------------------------------------
  public single_play(_: unknown, ctx: WsContext) {
    const game = this._gameService.startSingeplayer(ctx.id);
    ctx.broadcast(createGameMessage(game.id, ctx.id), [ctx.id]);

    const rooms = this._gameService.getRooms();
    ctx.broadcast(updateRoomMessage(rooms));
  }

  // ----------------------------------------------------------------
  public create_room(_: unknown, ctx: WsContext) {
    this._gameService.createRoom(ctx.id);

    const rooms = this._gameService.getRooms();
    ctx.broadcast(updateRoomMessage(rooms));
  }

  // ----------------------------------------------------------------
  public add_user_to_room(data: unknown, ctx: WsContext) {
    const { indexRoom } = data as AddUserToRoomPayload;

    const game = this._gameService.joinRoom(indexRoom, ctx.id);
    if (!game) return;
    game.players.forEach((playerId) =>
      ctx.broadcast(createGameMessage(game.id, playerId), [playerId])
    );

    const rooms = this._gameService.getRooms();
    ctx.broadcast(updateRoomMessage(rooms));
  }

  // ----------------------------------------------------------------
  public add_ships(data: unknown, ctx: WsContext) {
    const { gameId, ships, indexPlayer } = data as AddShipsPayload;

    const game = this._gameService.addShips(gameId, indexPlayer, ships);
    if (!game) return;

    // send "start_game" messages to the players
    const { currentPlayer, currentShips, enemyPlayer, enemyShips } = game;
    [
      { player: currentPlayer, ships: currentShips },
      { player: enemyPlayer, ships: enemyShips },
    ].map(({ player, ships }) =>
      ctx.broadcast(
        startGameMessage(
          player,
          ships.map((ship) => this._getShipDto(ship))
        ),
        [player]
      )
    );

    // send "turn" message to the players
    ctx.broadcast(turnMessage(currentPlayer), [currentPlayer, enemyPlayer]);

    if (game.currentPlayer === BOT_ID) {
      this._botAttack(gameId, ctx);
    }
  }

  // ----------------------------------------------------------------
  public attack(data: unknown, ctx: WsContext) {
    const { gameId, x, y, indexPlayer } = data as AttackPayload;

    const position = x === undefined || y === undefined ? undefined : { x, y };
    const { game, results } = this._gameService.attack(gameId, indexPlayer, position);
    ctx.broadcast(attackResultMessages(results), game.players);
    ctx.broadcast(turnMessage(game.currentPlayer), game.players);

    if (game.status === GameStatus.Started && game.currentPlayer === BOT_ID) {
      this._botAttack(gameId, ctx);
    }

    if (!game.winner) return;
    ctx.broadcast(finishMessage(game.winner), game.players);

    if (game.winner !== BOT_ID) {
      const winners = this._gameService.getWinners();
      ctx.broadcast(updateWinnersMessage(winners));
    }
  }

  // ----------------------------------------------------------------
  public randomAttack(data: unknown, ctx: WsContext) {
    this.attack(data, ctx);
  }

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------
  private _botAttack(gameId: Game['id'], ctx: WsContext) {
    const timeout = randomInt(BOT_MIN_TIMEOUT, BOT_MAX_TIMEOUT);
    setTimeout(() => this.randomAttack({ gameId, indexPlayer: BOT_ID }, ctx), timeout);
  }

  private _getShipDto({ position, length, isVertical }: Ship): ShipDto {
    const type = ['small', 'medium', 'large', 'huge'][length - 1] ?? 'unknown';
    return {
      position,
      length,
      direction: isVertical,
      type,
    };
  }
}
