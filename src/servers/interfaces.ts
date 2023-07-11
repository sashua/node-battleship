export interface WsMessage<T = unknown> {
  type: string;
  data: T;
  id: 0;
}

export interface WsContext {
  id: number;
  send: (msg: WsMessage | WsMessage[]) => void;
  broadcast: (msg: WsMessage | WsMessage[], conn?: number | number[]) => void;
}

export interface WsController {
  handleMessage: (msg: WsMessage, ctx: WsContext) => void;
  handleClose: (ctx: WsContext) => void;
}
