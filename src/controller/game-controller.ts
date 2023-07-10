import { Game } from '../model/game.js';
import { GameService } from '../service/game-service.js';
import { GameState, Player, ShipData } from '../types/game-types.js';
import {
  AddShipsPayload,
  AddUserToRoomPayload,
  AttackPayload,
  AttackResultPayload,
  CreateGamePayload,
  LoginPayload,
  LoginResultPayload,
  RandomAttackPayload,
  StartGamePayload,
  TurnPayload,
  UpdateRoomPayload,
} from '../types/message-types.js';
import { WsContext, WsController, WsMessage } from '../types/ws-types.js';

export class GameController implements WsController {
  private validTypes: (keyof this)[] = [
    'reg',
    'single_play',
    'create_room',
    'add_user_to_room',
    'add_ships',
    'attack',
    'randomAttack',
  ];

  constructor(private gameService: GameService) {}

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

  // ----------------------------------------------------------------
  public onClientClose = (ctx: WsContext) => {
    for (const game of this.gameService.getGames()) {
      if (!game.validPlayer(ctx.id)) continue;
      if (game.state === GameState.RoomOpened) {
        this.gameService.closeGame(game.id);
        const rooms = this.gameService.getOpenedRooms();
        ctx.broadcast(this.createUpdateRoomMessage(rooms));
      } else if (game.state === GameState.GameCreated || game.state === GameState.GameStarted) {
        const winner = game.getEnemy(ctx.id);
        ctx.broadcast(this.createFinishMessage(winner), [winner]);
        this.gameService.setWinner(winner);
        const winners = this.gameService.getWinners();
        ctx.broadcast(this.createUpdateWinnersMessage(winners));
        this.gameService.closeGame(game.id);
      }
    }
    this.gameService.logout(ctx.id);
  };

  // ----------------------------------------------------------------
  // Controllers
  // ----------------------------------------------------------------
  public reg(data: unknown, ctx: WsContext) {
    const loginPayload = data as LoginPayload;
    const player = this.gameService.login(ctx.id, loginPayload);
    const rooms = this.gameService.getOpenedRooms();
    const winners = this.gameService.getWinners();
    ctx.send(this.createRegMessage(player));
    ctx.send(this.createUpdateRoomMessage(rooms));
    ctx.broadcast(this.createUpdateWinnersMessage(winners));
  }

  // ----------------------------------------------------------------
  public single_play(data: unknown, ctx: WsContext) {
    40 + 2;
  }

  // ----------------------------------------------------------------
  public create_room(_: unknown, ctx: WsContext) {
    const game = this.gameService.createGame(ctx.id);
    if (!game) return;
    const rooms = this.gameService.getOpenedRooms();
    ctx.broadcast(this.createUpdateRoomMessage(rooms));
  }

  // ----------------------------------------------------------------
  public add_user_to_room(data: unknown, ctx: WsContext) {
    const { indexRoom } = data as AddUserToRoomPayload;
    const game = this.gameService.getGame(indexRoom);
    if (!game) return;
    game.addPlayer(ctx.id);
    if (game.state !== GameState.GameCreated) return;
    const rooms = this.gameService.getOpenedRooms();
    ctx.broadcast(this.createUpdateRoomMessage(rooms));
    const messages = this.createCreateGameMessages(game);
    ctx.broadcast(messages[0], [game.players[0]]);
    ctx.broadcast(messages[1], [game.players[1]]);
  }

  // ----------------------------------------------------------------
  public add_ships(data: unknown, ctx: WsContext) {
    const { gameId, ships, indexPlayer } = data as AddShipsPayload;
    const game = this.gameService.getGame(gameId);
    if (!game) return;
    game.addShips(indexPlayer, ships);
    if (game.state !== GameState.GameStarted) return;
    game
      .getPlayersShips()
      .forEach(({ playerId, ships }) =>
        ctx.broadcast(this.createStartGameMessage(playerId, ships), [playerId])
      );
    ctx.broadcast(this.createTurnMessage(game), game.players);
  }

  // ---------------------c-------------------------------------------
  public attack(data: unknown, ctx: WsContext) {
    const { gameId, x, y, indexPlayer } = data as AttackPayload;
    const game = this.gameService.getGame(gameId);
    if (!game) return;
    const results = game.attack(indexPlayer, { x, y });
    ctx.broadcast(this.createAttackResultMessages(results), game.players);
    ctx.broadcast(this.createTurnMessage(game), game.players);
    if (game.state !== GameState.GameFinished || !game.winner) return;
    ctx.broadcast(this.createFinishMessage(game.winner), game.players);
    this.gameService.setWinner(game.winner);
    const winners = this.gameService.getWinners();
    ctx.broadcast(this.createUpdateWinnersMessage(winners));
    this.gameService.closeGame(game.id);
  }

  // ----------------------------------------------------------------
  public randomAttack(data: unknown, ctx: WsContext) {
    const { gameId, indexPlayer } = data as RandomAttackPayload;
    const game = this.gameService.getGame(gameId);
    if (!game) return;
    const position = game.getRandomAttackPosition(indexPlayer);
    if (!position) return;
    this.attack({ gameId, x: position.x, y: position.y, indexPlayer }, ctx);
  }

  // ----------------------------------------------------------------
  // Private Message Factory Methods
  // ----------------------------------------------------------------
  private createRegMessage = (player?: Player, errorMessage?: string) =>
    this.createMessage<LoginResultPayload>('reg', {
      index: player?.id ?? -1,
      name: player?.name ?? '',
      error: false,
      errorText: errorMessage ?? '',
    });

  // ----------------------------------------------------------------
  private createCreateGameMessages = (game: Game) =>
    game.players.map((playerId) =>
      this.createMessage<CreateGamePayload>('create_game', { idGame: game.id, idPlayer: playerId })
    );

  // ----------------------------------------------------------------
  private createUpdateRoomMessage = (games: Game[]) =>
    this.createMessage<UpdateRoomPayload>(
      'update_room',
      games.map((game) => {
        const player = this.gameService.getPlayerById(game.players[0]);
        return {
          roomId: game.id,
          roomUsers: [{ index: player?.id ?? -1, name: player?.name ?? '' }],
        };
      })
    );

  // ----------------------------------------------------------------
  private createStartGameMessage = (playerId: Player['id'], ships: ShipData[]) =>
    this.createMessage<StartGamePayload>('start_game', {
      ships,
      currentPlayerIndex: playerId,
    });

  // ----------------------------------------------------------------
  private createTurnMessage = (game: Game) =>
    this.createMessage<TurnPayload>('turn', { currentPlayer: game.currentPlayer });

  // ----------------------------------------------------------------
  private createAttackResultMessages = (results: AttackResultPayload[]) =>
    results.map((result) => this.createMessage<AttackResultPayload>('attack', result));

  // ----------------------------------------------------------------
  private createFinishMessage = (winner: Player['id']) =>
    this.createMessage('finish', { winPlayer: winner });

  // ----------------------------------------------------------------
  private createUpdateWinnersMessage = (players: Player[]) =>
    this.createMessage(
      'update_winners',
      players.map(({ name, wins }) => ({ name, wins }))
    );

  // ----------------------------------------------------------------
  private createMessage = <T>(type: string, data: T): WsMessage<T> => ({ type, data, id: 0 });
}
