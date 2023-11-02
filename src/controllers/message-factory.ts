import { Game } from '../core/game.js';
import { WsMessage } from '../servers/interfaces.js';
import { Player, Room, ShipDto } from '../services/interfaces.js';
import {
  AttackResultPayload,
  CreateGamePayload,
  LoginResultPayload,
  StartGamePayload,
  TurnPayload,
  UpdateRoomPayload,
} from './interfaces.js';

const createMessage = <T>(type: string, data: T): WsMessage<T> => ({ type, data, id: 0 });

export const regMessage = (player: Partial<Player> | null, errorMessage?: string) =>
  createMessage<LoginResultPayload>('reg', {
    index: player?.id ?? -1,
    name: player?.name ?? '',
    error: Boolean(errorMessage),
    errorText: errorMessage ?? '',
  });

export const createGameMessage = (gameId: Game['id'], playerId: Player['id']) =>
  createMessage<CreateGamePayload>('create_game', { idGame: gameId, idPlayer: playerId });

export const updateRoomMessage = (rooms: Room[]) =>
  createMessage<UpdateRoomPayload>(
    'update_room',
    rooms.map(({ id, playerId, playerName }) => ({
      roomId: id,
      roomUsers: [{ index: playerId, name: playerName }],
    }))
  );

export const startGameMessage = (playerId: Player['id'], ships: ShipDto[]) =>
  createMessage<StartGamePayload>('start_game', {
    ships,
    currentPlayerIndex: playerId,
  });

export const turnMessage = (currentPlayer: Player['id']) =>
  createMessage<TurnPayload>('turn', { currentPlayer });

export const attackResultMessages = (results: AttackResultPayload[]) =>
  results.map((result) => createMessage<AttackResultPayload>('attack', result));

export const finishMessage = (winner: Player['id']) =>
  createMessage('finish', { winPlayer: winner });

export const updateWinnersMessage = (players: Player[]) =>
  createMessage(
    'update_winners',
    players.map(({ name, wins }) => ({ name, wins }))
  );
