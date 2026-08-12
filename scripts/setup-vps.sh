#!/usr/bin/env bash
# Provisiona a automação numa VPS Ubuntu (ex: Oracle Cloud Free Tier).
# Uso: rode este script de dentro da pasta do projeto já clonado.
#   bash scripts/setup-vps.sh
#
# Ele instala Node.js + pm2, instala as dependências do projeto e prepara o .env.
# O login no WhatsApp (QR code) e o "pm2 start" continuam manuais e interativos —
# veja as instruções impressas no final.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "==> Projeto em: $PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "==> Instalando Node.js 20.x..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node.js já instalado: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Instalando pm2 globalmente..."
  sudo npm install -g pm2
else
  echo "==> pm2 já instalado: $(pm2 -v)"
fi

echo "==> Instalando dependências do projeto..."
npm install

if [ ! -f .env ]; then
  echo "==> Criando .env a partir do .env.example..."
  cp .env.example .env
  echo "    Edite o .env se precisar ajustar nomes de grupo, horários ou fuso."
else
  echo "==> .env já existe, mantendo como está."
fi

cat <<'EOF'

==> Setup concluído.

Próximos passos (manuais, precisam de interação):

1) Faça o primeiro login escaneando o QR code:
     node index.js
   Abra WhatsApp no número que participa dos 3 grupos > Aparelhos conectados >
   Conectar aparelho > escaneie o QR mostrado no terminal.
   Confirme nos logs que os 3 grupos foram resolvidos, depois pressione Ctrl+C.

2) Suba a automação em segundo plano com pm2:
     pm2 start ecosystem.config.js
     pm2 save
     pm2 startup
   (siga a instrução impressa pelo "pm2 startup" para sobreviver a reboots da VPS)

Comandos úteis:
  pm2 logs whatsapp-vagas-forwarder
  pm2 restart whatsapp-vagas-forwarder
  pm2 stop whatsapp-vagas-forwarder
EOF
