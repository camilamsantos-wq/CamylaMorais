require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

module.exports = {
  sourceGroups: [
    {
      name: process.env.SOURCE_GROUP_1_NAME || 'Networking Premium - BIZ / TECH / DIGITAL',
      jid: process.env.SOURCE_GROUP_1_JID || null,
    },
    {
      name: process.env.SOURCE_GROUP_2_NAME || 'MCIO Oportunidades de mercado',
      jid: process.env.SOURCE_GROUP_2_JID || null,
    },
  ],
  targetGroup: {
    name: process.env.TARGET_GROUP_NAME || 'CS Mentoria de Carreira | Tech Women',
    jid: process.env.TARGET_GROUP_JID || null,
  },
  scheduleCron1: process.env.SCHEDULE_CRON_1 || '0 10 * * *',
  scheduleCron2: process.env.SCHEDULE_CRON_2 || '0 16 * * *',
  timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
  authDir: process.env.AUTH_DIR || './auth',
  dataDir: process.env.DATA_DIR || './data',
  runOnce: process.env.RUN_ONCE === 'true',
};
