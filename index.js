const config = require('./src/config');
const logger = require('./src/logger');
const { connectWhatsApp, waitForOpenConnection, resolveGroupJid } = require('./src/whatsapp');
const { MessageStore } = require('./src/messageStore');
const { scheduleForwarding } = require('./src/scheduler');
const { flushAndForward } = require('./src/forwarder');

async function main() {
  const sock = await connectWhatsApp(config.authDir);
  await waitForOpenConnection(sock);

  const sourceGroups = await Promise.all(
    config.sourceGroups.map(async (g) => ({ name: g.name, jid: await resolveGroupJid(sock, g) })),
  );
  const targetJid = await resolveGroupJid(sock, config.targetGroup);

  logger.info({ sourceGroups, targetJid }, 'Grupos resolvidos com sucesso.');

  const store = new MessageStore(config.dataDir);
  const sourceJidSet = new Set(sourceGroups.map((g) => g.jid));

  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const waMessage of messages) {
      const remoteJid = waMessage.key?.remoteJid;
      if (waMessage.key?.fromMe) continue;
      if (!remoteJid || !sourceJidSet.has(remoteJid)) continue;
      store.append(remoteJid, waMessage);
    }
  });

  if (config.runOnce) {
    logger.info('RUN_ONCE ativado: executando o envio imediatamente.');
    await flushAndForward({ sock, store, sourceGroups, targetJid });
    process.exit(0);
    return;
  }

  scheduleForwarding({
    sock,
    store,
    sourceGroups,
    targetJid,
    cronTimes: [config.scheduleCron1, config.scheduleCron2],
    timezone: config.timezone,
  });

  logger.info('Automação em execução. Aguardando mensagens dos grupos de origem...');
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar a automação.');
  process.exit(1);
});
