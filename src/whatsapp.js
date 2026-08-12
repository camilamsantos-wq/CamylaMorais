const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const logger = require('./logger');

/** Conecta ao WhatsApp via Baileys, reconectando automaticamente enquanto a sessão não for deslogada. */
async function connectWhatsApp(authDir) {
  const { state, saveCreds } = await useMultiFileAuthState(path.resolve(authDir));
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger.child({ module: 'baileys' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nEscaneie o QR code abaixo em WhatsApp > Aparelhos conectados > Conectar aparelho:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      logger.warn({ statusCode }, 'Conexão com o WhatsApp encerrada.');

      if (loggedOut) {
        logger.error('Sessão desconectada (logout). Apague a pasta de auth/ e escaneie o QR novamente.');
      } else {
        logger.info('Tentando reconectar...');
        connectWhatsApp(authDir).catch((err) => logger.error({ err }, 'Falha ao reconectar'));
      }
    } else if (connection === 'open') {
      logger.info('Conectado ao WhatsApp com sucesso.');
    }
  });

  return sock;
}

/** Aguarda a conexão abrir e retorna todos os grupos em que a conta participa. */
function waitForOpenConnection(sock) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Tempo esgotado aguardando conexão com o WhatsApp.')), 120000);
    sock.ev.on('connection.update', ({ connection }) => {
      if (connection === 'open') {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

/** Resolve o JID de um grupo pelo nome exato (ou usa o JID informado diretamente, se houver). */
async function resolveGroupJid(sock, { name, jid }) {
  if (jid) return jid;

  const groups = await sock.groupFetchAllParticipating();
  const match = Object.values(groups).find(
    (g) => g.subject?.trim().toLowerCase() === name.trim().toLowerCase(),
  );

  if (!match) {
    throw new Error(
      `Grupo "${name}" não encontrado entre os grupos participantes desta conta. ` +
      'Confira o nome exato com "npm run list-groups" ou defina o JID manualmente no .env.',
    );
  }

  return match.id;
}

module.exports = { connectWhatsApp, waitForOpenConnection, resolveGroupJid };
