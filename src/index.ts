import { HTTP_PORT } from './config/index.js';
import { httpServer } from './server/http-server.js';

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
