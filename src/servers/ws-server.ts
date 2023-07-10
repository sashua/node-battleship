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
  private _clientToId = new Map<WebSocket, number>();
  private _idToClient = new Map<number, WebSocket>();

  constructor({ server, controller }: Dependencies) {
    super({ server });
    this._controller = controller;
    this.on('connection', this.onConnection);
    this.on('close', this.onClose);
  }

  // ----------------------------------------------------------------
  // Public Methods
  // ----------------------------------------------------------------
  public broadcast = (msg: WsMessage | WsMessage[], clientsIds?: number[]) => {
    try {
      const messages = Array.isArray(msg) ? msg : [msg];
      for (const message of messages) {
        const rawMessage = this.stringifyMessage(message);
        console.log(color.blue('⋙', rawMessage));
        const clients = clientsIds ? this.getClientsByIds(clientsIds) : this.clients;
        clients.forEach((ws) => ws.send(rawMessage));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(color.red('⊘ Internal server error:', message));
    }
  };

  // ----------------------------------------------------------------
  // Private Event Handlers
  // ----------------------------------------------------------------
  private onConnection = (ws: WebSocket) => {
    const ctx = this.createContext(ws);
    console.log(color.green('⊕', `Client ${ctx.id} connected`));
    ws.on('message', this.onClientMessage(ctx));
    ws.on('close', this.onClientClose(ctx));
  };

  // ----------------------------------------------------------------
  private onClose = () => {
    console.log(color.magenta('⊗ Server closed'));
    this.clients.forEach((ws) => ws.close());
  };

  // ----------------------------------------------------------------
  private onClientMessage = (ctx: WsContext) => (rawMessage: RawData) => {
    try {
      console.log(color.yellow('⋘', rawMessage.toString()));
      const message = this.parseMessage(rawMessage);
      this._controller.onClientMessage(message, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(color.red('⊘ Internal server error:', message));
    }
  };

  // ----------------------------------------------------------------
  private onClientClose = (ctx: WsContext) => () => {
    this._controller.onClientClose(ctx);
    this.deleteClientById(ctx.id);
    console.log(color.magenta('⊖', `Client ${ctx.id} disconnected`));
  };

  // ----------------------------------------------------------------
  // Private Helper Methods
  // ----------------------------------------------------------------
  private parseMessage = (rawMessage: RawData) => {
    const { type, data: rawData } = JSON.parse(rawMessage.toString());
    const data = rawData ? JSON.parse(rawData) : undefined;
    return { type, data } as WsMessage;
  };

  // ----------------------------------------------------------------
  private stringifyMessage = ({ type, data }: WsMessage) => {
    return JSON.stringify({ type, data: JSON.stringify(data), id: 0 });
  };

  // ----------------------------------------------------------------
  private createContext = (ws: WebSocket): WsContext => {
    const id = randomId();
    this._idToClient.set(id, ws);
    this._clientToId.set(ws, id);
    return {
      id,
      send: (msg: WsMessage | WsMessage[]) =>
        (Array.isArray(msg) ? msg : [msg]).forEach((message) => {
          const rawMessage = this.stringifyMessage(message);
          console.log(color.blue('⋙', rawMessage));
          ws.send(rawMessage);
        }),
      broadcast: this.broadcast,
    };
  };

  // ----------------------------------------------------------------
  private deleteClientById(id: number) {
    const ws = this._idToClient.get(id);
    this._idToClient.delete(id);
    if (ws) this._clientToId.delete(ws);
  }

  // ----------------------------------------------------------------
  private getClientsByIds(ids: number[] = []): WebSocket[] {
    return ids.reduce((clients, id) => {
      const client = this._idToClient.get(id);
      if (client) clients.push(client);
      return clients;
    }, [] as WebSocket[]);
  }
}
