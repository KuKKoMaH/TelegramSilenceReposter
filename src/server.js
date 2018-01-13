const http = require('http');
const url = require('url');
const qs = require('qs');
const config = require('../config');
const router = require('./router');

async function createServer() {
  const server = http.createServer(( req, res ) => {
    const reqUrl = url.parse(req.url);
    if (!router[reqUrl.pathname]) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.write('');
      res.end();
      return;
    }

    let body = [];
    req.on('error', ( err ) => {
      console.error(err);
      res.end();
    }).on('data', ( chunk ) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      router[reqUrl.pathname](req, res, reqUrl, qs.parse(body));
    });
  });
  server.listen(config.port);
  return server;
}

module.exports = createServer;
