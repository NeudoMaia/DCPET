const express = require('express');
const path = require('path');
const cors = require('cors');

// Importar módulo de sensores
let sensoresHandler;
try {
    sensoresHandler = require('./api/sensores');
} catch (err) {
    console.warn('[DCPET] Aviso: ./api/sensores não encontrado diretamente:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// 1. Endpoint de Healthcheck para Docker e Monitoramento
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'dcpet-defesa-civil',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// 2. Endpoint da API de Sensores (Meteorologia Real / Fallback)
app.all('/api/sensores', async (req, res) => {
    if (typeof sensoresHandler === 'function') {
        try {
            await sensoresHandler(req, res);
        } catch (e) {
            console.error('[DCPET Server] Erro no handler de sensores:', e);
            res.status(500).json({ error: 'Erro interno ao processar sensores' });
        }
    } else {
        res.status(503).json({ error: 'Módulo de sensores indisponível' });
    }
});

// 3. Servir arquivos estáticos (HTML, CSS, JS, Data GeoJSON)
app.use(express.static(path.join(__dirname)));

// 4. Fallback para rotas SPA / navegação direta
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  DCPET v4.0 - Defesa Civil de Fortaleza`);
    console.log(`  Servidor ouvindo em: http://0.0.0.0:${PORT}`);
    console.log(`  Healthcheck:         http://localhost:${PORT}/health`);
    console.log(`  Sensores API:        http://localhost:${PORT}/api/sensores`);
    console.log(`====================================================`);
});
