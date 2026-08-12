const fs = require('fs');
const path = require('path');

/** Guarda em disco as mensagens recebidas de cada grupo de origem até o próximo envio agendado. */
class MessageStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    fs.mkdirSync(dataDir, { recursive: true });
  }

  bufferPath(groupJid) {
    const safeName = groupJid.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(this.dataDir, `buffer-${safeName}.json`);
  }

  read(groupJid) {
    const file = this.bufferPath(groupJid);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return [];
    }
  }

  append(groupJid, waMessage) {
    const messages = this.read(groupJid);
    const id = waMessage.key?.id;
    if (id && messages.some((m) => m.key?.id === id)) return; // evita duplicata
    messages.push(waMessage);
    fs.writeFileSync(this.bufferPath(groupJid), JSON.stringify(messages));
  }

  clear(groupJid) {
    fs.writeFileSync(this.bufferPath(groupJid), JSON.stringify([]));
  }
}

module.exports = { MessageStore };
