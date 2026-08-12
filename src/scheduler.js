const cron = require('node-cron');
const logger = require('./logger');
const { flushAndForward } = require('./forwarder');

/** Agenda os dois envios diários (10h e 16h, configuráveis via .env) no fuso horário definido. */
function scheduleForwarding({ sock, store, sourceGroups, targetJid, cronTimes, timezone }) {
  const run = () => {
    flushAndForward({ sock, store, sourceGroups, targetJid }).catch((err) =>
      logger.error({ err }, 'Erro ao executar o envio agendado'),
    );
  };

  for (const cronTime of cronTimes) {
    cron.schedule(cronTime, run, { timezone });
    logger.info(`Envio agendado: "${cronTime}" (${timezone})`);
  }
}

module.exports = { scheduleForwarding };
