/* eslint-disable no-magic-numbers, no-unused-vars */
//@ts-check

process.on('uncaughtException', error =>
  console.error(`Uncaught exception "${error.constructor.name}" (code: ${error.code}): ${error.message}`, error)
);
process.on('unhandledRejection', error =>
  console.error(`Uncaught rejection "${error.constructor.name}" (code: ${error.code}): ${error.message}`, error)
);

const logdown = require('logdown');
const path = require('path');
const TimeUnits = require('./TimeUnits');
require('dotenv').config({path: path.join(__dirname, 'echo2.env')});

const logger = logdown('@wireapp/core/demo/sender.js', {
  logger: console,
  markdown: false,
});
logger.state.isEnabled = true;

const {Account} = require('@wireapp/core');
const APIClient = require('@wireapp/api-client');
const {ClientType} = require('@wireapp/api-client/dist/commonjs/client/ClientType');
const {Config} = require('@wireapp/api-client/dist/commonjs/Config');
const {FileEngine} = require('@wireapp/store-engine');

(async () => {
  const CONVERSATION_ID = process.env.WIRE_CONVERSATION_ID;
  const MESSAGE_TIMER = 5000;

  const login = {
    clientType: ClientType.TEMPORARY,
    email: process.env.WIRE_EMAIL,
    password: process.env.WIRE_PASSWORD,
  };

  const backend = process.env.WIRE_BACKEND === 'staging' ? APIClient.BACKEND.STAGING : APIClient.BACKEND.PRODUCTION;
  const engine = new FileEngine(path.join(__dirname, '.tmp', 'sender'));
  await engine.init(undefined, {fileExtension: '.json'});
  const apiClient = new APIClient(new Config(engine, backend));
  const account = new Account(apiClient);
  await account.login(login);
  await account.listen();

  const name = await account.service.self.getName();

  logger.log('Name', name);
  logger.log('User ID', account.service.self.apiClient.context.userId);
  logger.log('Client ID', account.service.self.apiClient.context.clientId);

  async function sendAndDeleteMessage() {
    const deleteTextPayload = await account.service.conversation.createText('Delete me!');
    const {id: messageId} = await account.service.conversation.send(CONVERSATION_ID, deleteTextPayload);

    const fiveSecondsInMillis = 5000;
    setTimeout(async () => {
      await account.service.conversation.deleteMessageEveryone(CONVERSATION_ID, messageId);
    }, fiveSecondsInMillis);
  }

  async function sendConversationLevelTimer(timeInMillis = TimeUnits.ONE_YEAR_IN_MILLIS) {
    await account.service.conversation.apiClient.conversation.api.putConversationMessageTimer(CONVERSATION_ID, {
      message_timer: timeInMillis,
    });
  }

  async function sendEphemeralText(expiry = MESSAGE_TIMER) {
    account.service.conversation.messageTimer.setMessageLevelTimer(CONVERSATION_ID, expiry);
    const payload = await account.service.conversation.createText(`Expires after ${expiry}ms ...`);
    await account.service.conversation.send(CONVERSATION_ID, payload);
    account.service.conversation.messageTimer.setMessageLevelTimer(CONVERSATION_ID, 0);
  }

  async function sendPing(expiry = MESSAGE_TIMER) {
    account.service.conversation.messageTimer.setMessageLevelTimer(CONVERSATION_ID, expiry);
    const payload = await account.service.conversation.createPing();
    await account.service.conversation.send(CONVERSATION_ID, payload);
    account.service.conversation.messageTimer.setMessageLevelTimer(CONVERSATION_ID, 0);
  }

  async function sendText() {
    const payload = await account.service.conversation.createText('Hello, World!');
    await account.service.conversation.send(CONVERSATION_ID, payload);
  }

  const methods = [sendAndDeleteMessage, sendEphemeralText, sendPing, sendText];

  const timeoutInMillis = 2000;
  setInterval(() => {
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];
    randomMethod();
  }, timeoutInMillis);
})();
