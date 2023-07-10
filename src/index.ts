import { HTTP_PORT } from './config/index.js';
import { AppController } from './controllers/app-controller.js';
import { InmemoryDB } from './db/inmemory-db.js';
import { color } from './lib/color.js';
import { httpServer } from './servers/http-server.js';
import { WsServer } from './servers/ws-server.js';
import { GameService } from './services/game-service.js';
import { Player, Room } from './services/interfaces.js';

const playersDB = new InmemoryDB<Player>();
const roomsDB = new InmemoryDB<Room>();
const gameService = new GameService({ playersDB, roomsDB });
const appController = new AppController({ gameService });
new WsServer({ server: httpServer, controller: appController });

httpServer.listen(HTTP_PORT, () => {
  console.log(color.magenta('⊙', 'Http server is running on'), `http://localhost:${HTTP_PORT}`);
  console.log(color.magenta('⊙', 'Websocket server is running on'), `ws://localhost:${HTTP_PORT}`);
});
