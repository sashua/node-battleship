import { HTTP_PORT } from './config/index.js';
import { GameController } from './controller/game-controller.js';
import color from './lib/color.js';
import { httpServer } from './server/http-server.js';
import { WsServer } from './server/ws-server.js';
import { GameService } from './service/game-service.js';

const gameService = new GameService();
const gameController = new GameController(gameService);
new WsServer(httpServer, gameController);

httpServer.listen(HTTP_PORT, () => {
  console.log(color.magenta('⊙', 'Http server is running on'), `http://localhost:${HTTP_PORT}`);
  console.log(color.magenta('⊙', 'Websocket server is running on'), `ws://localhost:${HTTP_PORT}`);
});
