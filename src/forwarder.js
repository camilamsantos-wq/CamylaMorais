const { extractText } = require('./textExtractor');
const { isJobPosting } = require('./keywordFilter');
const logger = require('./logger');

const DELAY_BETWEEN_SENDS_MS = 3000; // evita rajada de mensagens (risco de limite/ban do WhatsApp)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lê o buffer de cada grupo de origem, filtra apenas vagas de trabalho e
 * encaminha (forward nativo do WhatsApp) para o grupo de destino.
 */
async function flushAndForward({ sock, store, sourceGroups, targetJid }) {
  let totalForwarded = 0;
  let totalDiscarded = 0;

  for (const group of sourceGroups) {
    const messages = store.read(group.jid);
    if (messages.length === 0) continue;

    logger.info(`[${group.name}] ${messages.length} mensagem(ns) recebida(s) desde o último envio.`);

    for (const waMessage of messages) {
      const text = extractText(waMessage);

      if (!isJobPosting(text)) {
        totalDiscarded += 1;
        continue;
      }

      try {
        await sock.sendMessage(targetJid, { forward: waMessage });
        totalForwarded += 1;
        await sleep(DELAY_BETWEEN_SENDS_MS);
      } catch (err) {
        logger.error({ err }, `Falha ao encaminhar mensagem do grupo "${group.name}"`);
      }
    }

    store.clear(group.jid);
  }

  logger.info(`Envio concluído: ${totalForwarded} vaga(s) encaminhada(s), ${totalDiscarded} mensagem(ns) descartada(s).`);
}

module.exports = { flushAndForward };
