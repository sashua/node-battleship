import { Server } from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { color } from '../lib/color.js';
import { randomId } from '../lib/random-id.js';
import { WsContext, WsController, WsMessage } from './interfaces.js';

interface Dependencies {
  server: Server;
  controller: WsController;
}

export class WsServer extends WebSocketServer {
  private _controller: WsController;
  private _clients = new Map<number, WebSocket>();

  constructor({ server, controller }: Dependencies) {
    super({ server });
    this._controller = controller;
    this.on('connection', this._onConnection);
    this.on('close', this._onClose);
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public broadcast = (
    msg: WsMessage | WsMessage[],
    ctxId?: WsContext['id'] | WsContext['id'][]
  ) => {
    try {
      const messages = Array.isArray(msg) ? msg : [msg];
      for (const message of messages) {
        const rawMessage = this._stringifyMessage(message);
        console.log(color.blue('⋙', rawMessage));
        const clients =
          ctxId === undefined
            ? this.clients
            : Array.isArray(ctxId)
            ? this._getConnectionsById(ctxId)
            : this._getConnectionsById([ctxId]);
        clients.forEach((ws) => ws.send(rawMessage));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(color.red('⊘ Error:', message));
    }
  };

  // ----------------------------------------------------------------
  // Private Event Handlers
  // ----------------------------------------------------------------
  private _onConnection = (ws: WebSocket) => {
    const ctx = this._createContext(ws);
    console.log(color.green('⊕', `Client connected ${ctx.id}`));
    ws.on('message', this._onConnectionMessage(ctx));
    ws.on('close', this._onConnectionClose(ctx));
  };

  // ----------------------------------------------------------------
  private _onClose = () => {
    console.log(color.magenta('⊗ Server closed'));
    this.clients.forEach((ws) => ws.close());
  };

  // ----------------------------------------------------------------
  private _onConnectionMessage = (ctx: WsContext) => (rawMessage: RawData) => {
    try {
      console.log(color.yellow('⋘', rawMessage.toString()));
      const message = this._parseMessage(rawMessage);
      this._controller.handleMessage(message, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(color.red('⊘ Error:', message));
    }
  };

  // ----------------------------------------------------------------
  private _onConnectionClose = (ctx: WsContext) => () => {
    this._controller.handleClose(ctx);
    this._clients.delete(ctx.id);
    console.log(color.magenta('⊖', `Client disconnected ${ctx.id}`));
  };

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------
  private _parseMessage = (rawMessage: RawData) => {
    const { type, data: rawData } = JSON.parse(rawMessage.toString());
    const data = rawData ? JSON.parse(rawData) : undefined;
    return { type, data } as WsMessage;
  };

  // ----------------------------------------------------------------
  private _stringifyMessage = ({ type, data }: WsMessage) => {
    return JSON.stringify({ type, data: JSON.stringify(data), id: 0 });
  };

  // ----------------------------------------------------------------
  private _createContext = (ws: WebSocket): WsContext => {
    const id = randomId();
    this._clients.set(id, ws);
    return { id, send: (msg) => this.broadcast(msg, id), broadcast: this.broadcast };
  };

  // ----------------------------------------------------------------
  private _getConnectionsById(ids: number[] = []): WebSocket[] {
    return ids.reduce((acc, id) => {
      const client = this._clients.get(id);
      if (client) acc.push(client);
      return acc;
    }, [] as WebSocket[]);
  }
}
