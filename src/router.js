const path = require('path');
const util = require('util');
const fs = require('fs');
const telegram = require('./telegram');

module.exports = {
  '/':         ( req, res ) => {
    util.promisify(fs.readFile)(path.resolve(__dirname, 'index.html'), 'utf-8').then(( template ) => {
      res.write(template);
      res.end();
    });
  },
  '/sendCode': async ( req, res, url, body ) => {
    try {
      const response = await telegram.sendCode(body.phone_number);
      res.write(response.phone_code_hash);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ error: e.type }));
    }
    res.end();
  },
  '/singIn':   async ( req, res, url, body ) => {
    try {
      const response = await telegram.singIn(body.phone_number, body.phone_code_hash, body.phone_code);
      console.log(response);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ error: e.type }));
    }
    res.end();
  },
  '/test':     async ( req, res, url, body ) => {

    try {
      const data = JSON.parse(body.data);
      console.log(data);
      const response = await telegram.call(data.method, data.params);
      res.write(JSON.stringify(response));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ error: e }));
    }
    res.end();
  },

};

// call('channels.getFullChannel', {channel: { _:"inputChannel", channel_id: 1158380792, access_hash:"15698840776860368125"}})