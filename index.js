const telegram = require('./src/telegram');
const config = require('./config');

if (config.create_server) {
  const createServer = require('./src/server');
  createServer();
}

const REQUEST_TIMEOUT = 5;
const SEPARATOR = '\n---------------\n';

const getRandomLong = () => Math.round(Math.random() * 100000000000);
const formatDate = ( timestamp ) => {
  const date = new Date(timestamp * 1000);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${day < 10 ? '0' : ''}${day}.${month < 10 ? '0' : ''}${month}.${date.getFullYear()} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
};
const formatMessageText = ( message, text ) => {
  let result = text || '';
  if (text) result += SEPARATOR;
  result += formatDate(message.date);
  return result;
};

const getMedia = ( message ) => ({
  _:  'inputMediaPhoto',
  id: {
    _:           'inputPhoto',
    id:          message.media.photo.id,
    access_hash: message.media.photo.access_hash
  },
});

const sendReplyInformer = channel => telegram.call('messages.sendMessage', {
  peer:      channel,
  message:   'Ответ на сообщение:',
  random_id: getRandomLong()
});

const sendForwardInformer = channel => telegram.call('messages.sendMessage', {
  peer:      channel,
  message:   'Пересланное сообщение:',
  random_id: getRandomLong()
});

const sendMessage = async ( fromChannel, toChannel, message, first = false, isReply = false, isForward = false ) => {
  const replyMessage = await getMessage(fromChannel, message.reply_to_msg_id);
  const forwardMessage = await getForwardMessage(fromChannel, message);

  if (first && (replyMessage || forwardMessage)) {
    await telegram.call('messages.sendMessage', {
      peer:      toChannel,
      message:   SEPARATOR + 'Начало цепочки',
      random_id: getRandomLong()
    });
  }

  if (replyMessage) await sendMessage(fromChannel, toChannel, replyMessage, false, true);
  if (forwardMessage) await sendMessage(fromChannel, toChannel, forwardMessage, false, false, true);

  if (isReply) await sendReplyInformer(toChannel);
  if (isForward) await sendForwardInformer(toChannel);

  if (message.media) {
    await telegram.call('messages.sendMedia', {
      peer:      toChannel,
      media:     {
        ...getMedia(message),
        caption: formatMessageText(message, message.media.caption).slice(0, 200),
      },
      random_id: getRandomLong()
    });
  }

  if (message.message) {
    await telegram.call('messages.sendMessage', {
      peer:      toChannel,
      message:   formatMessageText(message, message.message),
      random_id: getRandomLong()
    });
  }

  if (first && (replyMessage || forwardMessage)) {
    await telegram.call('messages.sendMessage', {
      peer:      toChannel,
      message:   'Конец цепочки' + SEPARATOR,
      random_id: getRandomLong()
    });
  }

  return Promise.resolve();
};

const sendQueue = ( fromChannel, toChannel, messages ) => {
  if (!messages.length) return;
  const message = messages.pop();
  return sendMessage(fromChannel, toChannel, message, true)
    .then(() => sendQueue(fromChannel, toChannel, messages));
};
const getForwardMessage = ( channel, message ) => {
  if (!message.fwd_from) return Promise.resolve(null);
  if (message.fwd_from.channel_id !== channel.channel_id) return 'Переслано сообщение из другого канала';
  return getMessage(channel, message.fwd_from.channel_post);
};
const getMessage = ( channel, messageId ) => {
  if (!messageId) return Promise.resolve(null);
  return telegram.call('channels.getMessages', { channel, id: [messageId] }).then(response => response.messages[0]);
};
const getLastId = channel => telegram.call('channels.getFullChannel', { channel }).then(response => +response.full_chat.about || undefined);
const saveLastId = ( channel, id ) => telegram.call('channels.editAbout', { channel, about: `${id}` });
const getHistory = ( channel, min_id ) => telegram.call('messages.getHistory', { peer: channel, min_id });

const forwardMessages = async ( fromChannel, toChannel ) => {
  const lastId = await getLastId(toChannel);
  const history = await getHistory(fromChannel, lastId);
  if (!history.messages.length) return;
  const newLastId = history.messages[0].id;
  await sendQueue(fromChannel, toChannel, history.messages);
  await saveLastId(toChannel, newLastId);
};

const run = () => {
  forwardMessages(config.fromChannel, config.toChannel).then(() => setTimeout(run, REQUEST_TIMEOUT * 1000));
};
if (config.run_import) run();




