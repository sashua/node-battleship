import fs from 'fs';
import http from 'http';
import path from 'path';

const __dirname = path.resolve(path.dirname(''));

export const httpServer = http.createServer(function (req, res) {
  const fileName = !req.url || req?.url === '/' ? 'index.html' : req.url;
  const filePath = path.join(__dirname, 'front', fileName);
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});
