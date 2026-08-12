/**
 * Utilitário: conecta ao WhatsApp e imprime nome + JID de todos os grupos em que
 * esta conta participa. Útil para conferir os nomes exatos ou pegar o JID quando
 * dois grupos têm o mesmo nome.
 *
 * Uso: npm run list-groups
 */
const config = require('./config');
const { connectWhatsApp, waitForOpenConnection } = require('./whatsapp');

(async () => {
  const sock = await connectWhatsApp(config.authDir);
  await waitForOpenConnection(sock);

  const groups = await sock.groupFetchAllParticipating();
  console.log('\nGrupos encontrados:\n');
  for (const g of Object.values(groups)) {
    console.log(`- ${g.subject}\n  JID: ${g.id}\n`);
  }

  process.exit(0);
})();
