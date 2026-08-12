# WhatsApp Vagas Forwarder

Automação que monitora dois grupos de WhatsApp, filtra apenas mensagens de **vagas de
trabalho** e encaminha essas mensagens (via forward nativo do WhatsApp, preservando
formatação/anexos) para um grupo de destino, duas vezes ao dia (10h e 16h, horário de
Brasília por padrão).

- Grupos de origem: `Networking Premium - BIZ / TECH / DIGITAL` e `MCIO Oportunidades de mercado`
- Grupo de destino: `CS Mentoria de Carreira | Tech Women`
- Regra: encaminha só vagas de emprego; descarta palestras, eventos, cursos e demais avisos.

## Como funciona

O WhatsApp não expõe uma API para "buscar mensagens antigas de um grupo" sob demanda.
Por isso a automação fica **conectada o tempo todo** (via [Baileys](https://github.com/WhiskeySockets/Baileys),
biblioteca não-oficial que funciona como um WhatsApp Web adicional), escutando as
mensagens dos dois grupos de origem em tempo real e guardando-as num buffer local
(`data/`). Duas vezes por dia, um agendador (`node-cron`) lê esse buffer, aplica o
filtro de palavras-chave e encaminha só o que parece vaga de emprego para o grupo de
destino — depois o buffer é esvaziado.

**Importante — risco:** Baileys não é a API oficial do WhatsApp/Meta. Ela conecta como
um "aparelho vinculado" à sua conta. Usar bots dessa forma viola os termos de uso do
WhatsApp e existe risco (baixo, mas real) de a conta ser banida. Recomenda-se:
- Usar um número secundário/dedicado para essa automação, não seu WhatsApp principal.
- Esse número precisa ser **participante dos 3 grupos** (os 2 de origem e o de destino).
- Evitar enviar mensagens em volume alto — o código já espera alguns segundos entre
  cada encaminhamento para reduzir esse risco.

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie o arquivo de configuração e ajuste se necessário:
   ```bash
   cp .env.example .env
   ```
   Por padrão os nomes dos grupos já estão preenchidos. Se dois grupos tiverem o
   mesmo nome, rode `npm run list-groups` (depois do primeiro login, veja abaixo) para
   pegar o JID exato e preencha `SOURCE_GROUP_1_JID` / `SOURCE_GROUP_2_JID` /
   `TARGET_GROUP_JID` no `.env`.

3. Primeiro login (gera o QR code no terminal):
   ```bash
   node index.js
   ```
   Abra o WhatsApp do número que vai rodar a automação → **Aparelhos conectados** →
   **Conectar aparelho** → escaneie o QR code exibido no terminal. A sessão fica salva
   em `auth/` (não é preciso escanear de novo, a menos que a sessão seja deslogada).

4. Depois de conectar, o programa confirma os grupos encontrados nos logs. Se algum
   grupo não for localizado, confira o nome exato com:
   ```bash
   npm run list-groups
   ```

## Rodando permanentemente (Oracle Cloud Free Tier)

Baileys precisa ficar conectado o tempo todo para conseguir capturar as mensagens em
tempo real (é assim que ele monta o buffer entre um envio e outro). Numa VPS Ubuntu na
Oracle Free Tier:

```bash
# Clonar o projeto
git clone <url-do-repositorio>
cd CamylaMorais

# Instala Node.js, pm2 e as dependências do projeto, e prepara o .env
bash scripts/setup-vps.sh
```

O script `scripts/setup-vps.sh` automatiza a instalação (Node.js, pm2, `npm install`,
criação do `.env`) e imprime no final os dois passos que ainda precisam ser feitos à
mão, por serem interativos:

```bash
# 1) Primeiro login (gera QR no terminal, precisa ser interativo)
node index.js
# escaneie o QR, confirme nos logs que os 3 grupos foram resolvidos, depois Ctrl+C

# 2) Subir com pm2 para rodar em segundo plano e reiniciar sozinho
pm2 start ecosystem.config.js
pm2 save
pm2 startup     # siga a instrução impressa para sobreviver a reboots da VPS
```

Comandos úteis do dia a dia:
```bash
pm2 logs whatsapp-vagas-forwarder   # ver logs em tempo real
pm2 restart whatsapp-vagas-forwarder
pm2 stop whatsapp-vagas-forwarder
```

## Ajustando o filtro de vagas

As palavras-chave que definem o que é considerado vaga (e o que é descartado, como
palestras/eventos) ficam em `src/keywordFilter.js`, nas listas `INCLUDE_KEYWORDS` e
`EXCLUDE_KEYWORDS`. Edite livremente para calibrar a precisão — não é preciso mexer em
mais nada do código.

## Testando manualmente

Para forçar um envio imediato (usa o que já estiver no buffer, sem esperar 10h/16h):
```bash
npm run run-once
```

## Estrutura

```
index.js              ponto de entrada: conecta, escuta mensagens, agenda os envios
src/config.js          variáveis de ambiente (grupos, horários, fuso, pastas)
src/whatsapp.js        conexão Baileys + resolução de grupos por nome
src/messageStore.js    buffer em disco das mensagens recebidas por grupo
src/textExtractor.js   extrai o texto de diferentes tipos de mensagem (texto, legenda, etc.)
src/keywordFilter.js   regra que decide o que é vaga de emprego
src/forwarder.js       lê o buffer, filtra e encaminha para o grupo de destino
src/scheduler.js       agenda os dois envios diários (cron)
src/listGroups.js      utilitário: lista nome + JID de todos os grupos da conta
scripts/setup-vps.sh   instala Node.js, pm2 e dependências numa VPS nova
auth/                  sessão autenticada do WhatsApp (não versionar, fazer backup)
data/                  buffer de mensagens pendentes (não versionar)
```

## Limitações conhecidas

- O filtro é por palavras-chave (sem custo de IA); mensagens ambíguas podem passar ou
  ser descartadas incorretamente — ajuste as listas em `src/keywordFilter.js` conforme
  observar os resultados.
- Se a VPS ficar desligada/sem internet durante o dia, mensagens enviadas nesse período
  não são capturadas (o Baileys precisa estar conectado em tempo real).
- Se a sessão for deslogada (logout pelo celular, por exemplo), é preciso escanear o QR
  novamente rodando `node index.js` de forma interativa.
