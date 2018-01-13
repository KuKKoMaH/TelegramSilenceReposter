const { Storage } = require('mtproto-storage-fs');
const MTProto = require('telegram-mtproto').default;
// const prompt = require('prompt');
const config = require('../config');

const client = MTProto({
  api: {
    layer:          57,
    initConnection: 0x69796de9,
    api_id:         config.api_id,
  },
  app: {
    storage: new Storage('./storage.json'),
  }
});

module.exports = {
  sendCode:   ( phone_number ) => client('auth.sendCode', {
    phone_number: phone_number,
    api_id:       config.api_id,
    api_hash:     config.api_hash,
  }),
  singIn:     ( phone_number, phone_code_hash, phone_code ) => client('auth.signIn', {
    phone_number,
    phone_code_hash,
    phone_code
  }),
  getDialogs: () => client('messages.getDialogs'),
  call:       ( method, params ) => client(method, params),
};

// async function connect() {
//   const { phone_code_hash } = await client('auth.sendCode', {
//     phone_number: phone.num,
//     api_id:       config.api_id,
//     api_hash:     config.api_hash,
//   });
//   const phone_code = await getCode();
//   const { user } = await client('auth.signIn', {
//     phone_number: phone.num,
//     phone_code_hash,
//     phone_code
//   });
//
//   const dialogs = await client('messages.getDialogs');
//
//   console.log('signed as ', dialogs);
// }
//
// connect();
//
// function getCode() {
//   return new Promise(( resolve ) => {
//     prompt.start();
//     prompt.get(['code'], function ( err, result ) {
//       resolve(result.code);
//     });
//   });
// }