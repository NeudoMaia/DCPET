#!/bin/bash
# ==========================================================
# Script de Deploy / Atualização Automática - DCPET (VM SEPOG)
# ==========================================================

set -e

echo "===================================================="
echo "    Iniciando Deploy do Sistema DCPET na VM SEPOG   "
echo "===================================================="

# 1. Atualizar repositório Git
echo "[1/4] Atualizando código via Git..."
git pull origin main

# 2. Execução via Docker Compose
if command -v docker &> /dev/null && (command -v docker-compose &> /dev/null || docker compose version &> /dev/null); then
    echo "[2/4] Docker detectado. Construindo e subindo containers..."
    docker compose down || true
    docker compose build --no-cache
    docker compose up -d
    echo "[3/4] Aguardando inicialização do container..."
    sleep 4
    echo "[4/4] Verificando status da aplicação..."
    docker compose ps
    echo "DCPET rodando com sucesso via Docker na porta 3005!"
else
    echo "[2/4] Modo nativo Node.js..."
    npm install --omit=dev
    
    if systemctl is-active --quiet dcpet 2>/dev/null; then
        echo "[3/4] Reiniciando serviço systemd dcpet..."
        systemctl restart dcpet
    elif command -v pm2 &> /dev/null; then
        echo "[3/4] Reiniciando aplicação no PM2..."
        pm2 restart dcpet || pm2 start "npm run start" --name dcpet
        pm2 save
    else
        echo "[3/4] Iniciando com nohup/node..."
        pkill -f "node server.js" || true
        nohup node server.js > dcpet.log 2>&1 &
    fi
    echo "[4/4] Deploy concluído!"
fi

echo "===================================================="
echo "   DCPET Deploy Concluído com Sucesso!              "
echo "   Endpoint Local: http://localhost:3005            "
echo "   Healthcheck:    http://localhost:3005/health     "
echo "===================================================="
