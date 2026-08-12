/** Extrai o texto legível de uma mensagem do Baileys, cobrindo os formatos mais comuns em grupos. */
function extractText(waMessage) {
  const m = waMessage?.message;
  if (!m) return '';

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ''
  );
}

module.exports = { extractText };
