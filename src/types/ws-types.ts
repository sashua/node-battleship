export interface WsMessage<T = unknown> {
  type: string;
  data: T;
  id: 0;
}

export interface WsContext {
  id: number;
  send: (msg: WsMessage | WsMessage[]) => void;
  broadcast: (msg: WsMessage | WsMessage[], clientIds?: number[]) => void;
}

export interface WsController {
  onClientMessage: (msg: WsMessage, ctx: WsContext) => void;
  onClientClose: (ctx: WsContext) => void;
}
