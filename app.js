document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do Lucide Icons
    lucide.createIcons();

    // --- CONFIGURAÇÃO E DADOS ---
    let activeStationId = 'st-001'; // DEFESA CIVIL - CENTRO
    let trendsChart = null;
    let isLiveAPI = false; // Indica se os dados estão vindo da API FastAPI local do observatório
    let isPlugfieldConnected = false; // Indica se a API Plugfield está ativa

    // Definição das 11 Estações Meteorológicas Oficiais da Defesa Civil de Fortaleza
    const officialStations = {
        'st-001': {
            name: 'DEFESA CIVIL - CENTRO',
            bairro: 'Centro',
            desc: 'Zona Comercial densa • Alto asfalto',
            lat: -3.7275,
            lng: -38.5270,
            tempOffset: 2.0,
            humidityOffset: -4,
            windOffset: 0.8,
            defaultSurface: 'asphalt',
            areas2km: ['Centro', 'Moura Brasil', 'Farias Brito', 'Jacarecanga', 'Benfica', 'José Bonifácio']
        },
        'st-002': {
            name: 'DEFESA CIVIL - BENFICA',
            bairro: 'Benfica',
            desc: 'Área universitária • Fluxo urbano',
            lat: -3.7431,
            lng: -38.5401,
            tempOffset: 1.2,
            humidityOffset: -2,
            windOffset: 1.6,
            defaultSurface: 'concrete',
            areas2km: ['Benfica', 'Farias Brito', 'Damas', 'Jardim América', 'Bom Futuro', 'Montese']
        },
        'st-003': {
            name: 'DEFESA CIVIL - CJ ESPERANÇA',
            bairro: 'Conjunto Esperança',
            desc: 'Área residencial periférica',
            lat: -3.8115,
            lng: -38.5670,
            tempOffset: 0.8,
            humidityOffset: 2,
            windOffset: 2.2,
            defaultSurface: 'concrete',
            areas2km: ['Conjunto Esperança', 'Mondubim', 'Parque Prefeito José Walter', 'Planalto Ayrton Senna']
        },
        'st-004': {
            name: 'DEFESA CIVIL - GRANJA LISBOA',
            bairro: 'Granja Lisboa',
            desc: 'Zona periférica • Baixa vegetação',
            lat: -3.7915,
            lng: -38.6045,
            tempOffset: 1.8,
            humidityOffset: 1,
            windOffset: 1.4,
            defaultSurface: 'asphalt',
            areas2km: ['Granja Lisboa', 'Granja Portugal', 'Bom Jardim', 'Siqueira', 'Conjunto Ceará']
        },
        'st-005': {
            name: 'DEFESA CIVIL - JANGURUSSU',
            bairro: 'Jangurussu',
            desc: 'Área residencial dispersa',
            lat: -3.8340,
            lng: -38.5140,
            tempOffset: 1.0,
            humidityOffset: 3,
            windOffset: 2.0,
            defaultSurface: 'concrete',
            areas2km: ['Jangurussu', 'Conjunto Palmeiras', 'Ancuri', 'Pedras', 'Messejana']
        },
        'st-006': {
            name: 'DEFESA CIVIL - MESSEJANA',
            bairro: 'Messejana',
            desc: 'Centro secundário urbano',
            lat: -3.8270,
            lng: -38.4980,
            tempOffset: 1.1,
            humidityOffset: 1,
            windOffset: 2.4,
            defaultSurface: 'asphalt',
            areas2km: ['Messejana', 'Cambeba', 'Paupina', 'Curió', 'Guajeru', 'Coaçu', 'Lagoa Redonda']
        },
        'st-007': {
            name: 'DEFESA CIVIL - MONTESE',
            bairro: 'Montese',
            desc: 'Bairro comercial tradicional',
            lat: -3.7650,
            lng: -38.5520,
            tempOffset: 1.5,
            humidityOffset: -2,
            windOffset: 1.2,
            defaultSurface: 'asphalt',
            areas2km: ['Montese', 'Itaoca', 'Vila União', 'Parangaba', 'Damas', 'Aeroporto', 'Serrinha']
        },
        'st-008': {
            name: 'DEFESA CIVIL - MUCURIPE',
            bairro: 'Mucuripe',
            desc: 'Orla costeira • Brisa constante',
            lat: -3.7240,
            lng: -38.4770,
            tempOffset: -1.0,
            humidityOffset: 8,
            windOffset: 6.2,
            defaultSurface: 'concrete',
            areas2km: ['Mucuripe', 'Meireles', 'Praia de Iracema', 'Varjota', 'Aldeota', 'Vicente Pinzón']
        },
        'st-009': {
            name: 'DEFESA CIVIL - VILA VELHA',
            bairro: 'Vila Velha',
            desc: 'Zona Oeste residencial',
            lat: -3.7270,
            lng: -38.5880,
            tempOffset: 0.9,
            humidityOffset: 4,
            windOffset: 3.5,
            defaultSurface: 'concrete',
            areas2km: ['Vila Velha', 'Barra do Ceará', 'Jardim Guanabara', 'Quintino Cunha', 'Cristo Redentor']
        },
        'st-010': {
            name: 'DEFESA CIVIL-GUARARAPES',
            bairro: 'Guararapes',
            desc: 'Canyons prediais • Concentração de calor',
            lat: -3.7620,
            lng: -38.4840,
            tempOffset: 1.3,
            humidityOffset: -1,
            windOffset: 1.5,
            defaultSurface: 'concrete',
            areas2km: ['Guararapes', 'Cocó', 'Luciano Cavalcante', 'Aldeota', 'Salinas', 'Edson Queiroz']
        },
        'st-011': {
            name: 'DEFESA CIVIL - DOM LUSTOSA',
            bairro: 'Dom Lustosa',
            desc: 'Zona residencial mista',
            lat: -3.7554,
            lng: -38.5832,
            tempOffset: 0.8,
            humidityOffset: 3,
            windOffset: 1.8,
            defaultSurface: 'concrete',
            areas2km: ['Dom Lustosa', 'Henrique Jorge', 'Pici', 'Autran Nunes', 'João XXIII', 'Bela Vista']
        }
    };

    // Estações Ativas Totais (oficiais + customizadas)
    let stations = { ...officialStations };

    // Caches de Telemetria
    let apiWeatherData = {}; // FastAPI
    let plugfieldWeatherData = {}; // Plugfield API
    let plugfieldAuth = null;
    let plugfieldInterval = null;

    // Configuração do Proxy Plugfield baseado no Host
    const PLUGFIELD_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'https://prod-api.plugfield.com.br' // Acesso direto (pode requerer CORS bypass local)
        : '/plugfield-api'; // Vercel Proxy

    // Definição dos Horários para a Calculadora
    const timeSlots = {
        '0': { hour: 2, rad: 0, label: 'Madrugada' },
        '1': { hour: 7, rad: 150, label: 'Início da Manhã' },
        '2': { hour: 10, rad: 550, label: 'Meio da Manhã' },
        '3': { hour: 12, rad: 950, label: 'Pico Solar' },
        '4': { hour: 15, rad: 700, label: 'Tarde' },
        '5': { hour: 20, rad: 0, label: 'Noite' }
    };

    // --- ELEMENTOS E INICIALIZAÇÃO DO MAPA LEAFLET ---
    let map = null;
    let mapMarkers = {};
    let mapCircles = {};

    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || map) return;

        // Centrado em Fortaleza
        map = L.map('map', {
            center: [-3.7584, -38.5398],
            zoom: 12,
            scrollWheelZoom: false
        });

        // Camada de Mapa Clara (CartoDB Light) condizente com o tema do DCCALOR
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Renderizar marcadores
        renderMapElements();
    }

    // Renderiza ou Atualiza Marcadores e Círculos no Leaflet
    function renderMapElements() {
        if (!map) return;

        const hour = new Date().getHours();

        Object.keys(stations).forEach(id => {
            const config = stations[id];
            const data = getWeather(id, hour);
            const meta = riskMeta[data.riskLevel];

            // 1. Criar ou Atualizar Marcador
            if (mapMarkers[id]) {
                // Atualizar cor e popup
                mapMarkers[id].setLatLng([config.lat, config.lng]);
            } else {
                // Criar novo marcador Leaflet padrão
                const marker = L.marker([config.lat, config.lng]).addTo(map);
                marker.on('click', () => {
                    selectStation(id);
                });
                mapMarkers[id] = marker;
            }

            // Bind de Popup Informativo
            const popupContent = `
                <div class="map-popup-custom">
                    <h4 style="font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; font-size: 0.85rem;">${config.name.replace('DEFESA CIVIL - ', '')}</h4>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 0 0 8px 0;">${config.desc || 'Estação Meteorológica'}</p>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 6px; display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-size: 0.725rem; font-weight: 700; color: ${meta.color};">Estresse IET-Pet: ${data.ietPet.toFixed(1)}°C (${meta.label})</span>
                        <span style="font-size: 0.7rem; color: var(--text-secondary);">Temp. Ar: <strong>${data.temperature}°C</strong> | Umid: <strong>${data.humidity}%</strong></span>
                        <span style="font-size: 0.7rem; color: var(--text-secondary);">Temp. Solo: <strong>${data.tempSurface}°C</strong> | Vento: <strong>${data.wind} m/s</strong></span>
                        ${data.isIoT ? '<span style="font-size: 0.65rem; color: var(--color-primary); font-weight: 800; text-transform: uppercase;">Estação Automática IoT</span>' : ''}
                    </div>
                </div>
            `;
            mapMarkers[id].bindPopup(popupContent);

            // 2. Criar ou Atualizar Círculo Termo-Interativo (IDW-like circle)
            const circleOptions = {
                color: meta.color,
                fillColor: meta.color,
                fillOpacity: 0.15 + (Math.max(0, data.ietPet - 25) * 0.015),
                radius: 1800,
                weight: 1.5,
                dashArray: config.isIoT ? '5, 8' : undefined
            };

            if (mapCircles[id]) {
                mapCircles[id].setLatLng([config.lat, config.lng]);
                mapCircles[id].setStyle(circleOptions);
            } else {
                const circle = L.circle([config.lat, config.lng], circleOptions).addTo(map);
                mapCircles[id] = circle;
            }
        });
    }

    // --- CARREGAR SENSORES CUSTOMIZADOS ---
    function loadCustomStations() {
        const stored = localStorage.getItem('dcpet_custom_stations');
        if (stored) {
            try {
                const customs = JSON.parse(stored);
                Object.keys(customs).forEach(id => {
                    stations[id] = customs[id];
                });
            } catch (e) {
                console.error('[DCPET] Erro ao carregar sensores customizados do localStorage:', e);
            }
        }
    }

    // --- CÁLCULOS TÉRMICOS E MODELAGEM FISIOLÓGICA ---

    // Simula as condições meteorológicas básicas baseadas na hora do dia
    function getSimulatedWeather(stationId, hour) {
        const config = stations[stationId];
        if (!config) return getSimulatedWeather('st-001', hour);
        
        const baseTemp = 27.5 + 3.5 * Math.sin((hour - 8) * Math.PI / 12);
        const temperature = parseFloat((baseTemp + (config.tempOffset || 0)).toFixed(1));

        const baseHumidity = 72.5 - 12.5 * Math.sin((hour - 8) * Math.PI / 12);
        const humidity = Math.round(baseHumidity + (config.humidityOffset || 0));

        let radiation = 0;
        if (hour >= 6 && hour <= 18) {
            radiation = Math.round(1000 * Math.sin((hour - 6) * Math.PI / 12));
        }

        const baseWind = 2.8 + 1.2 * Math.sin((hour - 10) * Math.PI / 12);
        const wind = parseFloat(Math.max(0.5, baseWind + ((config.windOffset || 0) - 2.8)).toFixed(1));

        const tempSurface = estimateSurfaceTemp(temperature, radiation, wind, config.defaultSurface || 'concrete');
        const ietPet = calculateIETPet(temperature, humidity, tempSurface, wind);

        return {
            temperature,
            humidity,
            wind,
            radiation,
            tempSurface,
            ietPet,
            riskLevel: getRiskLevel(ietPet),
            isIoT: !!config.isIoT
        };
    }

    // Unifica e resolve dados meteorológicos baseados em prioridades (Plugfield > FastAPI > Simulação)
    function getWeather(stationId, hour) {
        const config = stations[stationId];
        if (!config) return getSimulatedWeather('st-001', hour);

        // Prioridade 1: Dados da API Plugfield (Estações IoT reais da Defesa Civil)
        if (isPlugfieldConnected && plugfieldWeatherData[stationId]) {
            const plugfieldData = plugfieldWeatherData[stationId];
            const simulated = getSimulatedWeather(stationId, hour);

            const temperature = plugfieldData.temperature !== undefined ? parseFloat(plugfieldData.temperature.toFixed(1)) : simulated.temperature;
            const humidity = plugfieldData.humidity !== undefined ? parseInt(plugfieldData.humidity) : simulated.humidity;
            const wind = plugfieldData.windSpeed !== undefined ? parseFloat((plugfieldData.windSpeed / 3.6).toFixed(1)) : simulated.wind; // km/h para m/s
            const radiation = plugfieldData.uvIndex !== undefined ? Math.min(1000, plugfieldData.uvIndex * 100) : simulated.radiation;

            const tempSurface = estimateSurfaceTemp(temperature, radiation, wind, config.defaultSurface || 'concrete');
            const ietPet = calculateIETPet(temperature, humidity, tempSurface, wind);

            return {
                temperature,
                humidity,
                wind,
                radiation,
                tempSurface,
                ietPet,
                riskLevel: getRiskLevel(ietPet),
                isIoT: true,
                rainAccum24h: plugfieldData.rainAccum12h || 0
            };
        }

        // Prioridade 2: Dados da API local FastAPI (Observatório)
        if (isLiveAPI && apiWeatherData[stationId]) {
            const apiData = apiWeatherData[stationId];
            const simulated = getSimulatedWeather(stationId, hour);

            // Mapeia temperatura_c (real API) ou ultima_medicao (simulated API)
            let temperature = simulated.temperature;
            if (apiData.temperatura_c !== undefined && apiData.temperatura_c !== null) {
                temperature = parseFloat(apiData.temperatura_c.toFixed(1));
            } else if (apiData.ultima_medicao !== undefined && apiData.ultima_medicao !== null && apiData.ultima_medicao < 45) {
                // No main_local.py, ultima_medicao é chuva. Usamos apenas se for abaixo de 45 (verossímil para temp Fortaleza)
                // Caso contrário, mantemos a simulação de temperatura e usamos como chuva
                temperature = simulated.temperature;
            }

            const humidity = simulated.humidity; 
            const wind = simulated.wind;
            const radiation = simulated.radiation;

            const tempSurface = estimateSurfaceTemp(temperature, radiation, wind, config.defaultSurface || 'concrete');
            const ietPet = calculateIETPet(temperature, humidity, tempSurface, wind);

            return {
                temperature,
                humidity,
                wind,
                radiation,
                tempSurface,
                ietPet,
                riskLevel: getRiskLevel(ietPet),
                isIoT: false,
                rainAccum24h: apiData.chuva_24h || apiData.chuva_acumulada_24h || (apiData.ultima_medicao > 45 ? apiData.ultima_medicao : 0)
            };
        }

        // Prioridade 3: Sensor customizado registrado localmente (caso não tenha API rodando para ele)
        if (config.isCustomManual && config.manualData) {
            const simulated = getSimulatedWeather(stationId, hour);
            const temperature = config.manualData.temp;
            const humidity = config.manualData.humidity;
            const wind = simulated.wind;
            const radiation = simulated.radiation;

            const tempSurface = estimateSurfaceTemp(temperature, radiation, wind, config.defaultSurface || 'concrete');
            const ietPet = calculateIETPet(temperature, humidity, tempSurface, wind);

            return {
                temperature,
                humidity,
                wind,
                radiation,
                tempSurface,
                ietPet,
                riskLevel: getRiskLevel(ietPet),
                isIoT: true
            };
        }

        // Caso padrão: dados simulados estruturais
        return getSimulatedWeather(stationId, hour);
    }

    // Calcula o Índice de Estresse Térmico Pet (IET-Pet) baseado em fisiologia canina/felina
    function calculateIETPet(tempAir, humidity, tempSurface, wind) {
        const humidityFactor = 0.15 * (humidity - 50);
        const surfaceFactor = 0.3 * (tempSurface - tempAir);
        const windCooling = 0.5 * wind;
        const iet = tempAir + humidityFactor + surfaceFactor - windCooling;
        return parseFloat(iet.toFixed(1));
    }

    // Estima a temperatura de superfície do solo
    function estimateSurfaceTemp(tempAir, radiation, wind, surfaceType) {
        let factor = 0;
        let windFactor = 0;

        switch (surfaceType) {
            case 'asphalt':
                factor = 2.6;
                windFactor = 0.2;
                break;
            case 'concrete':
                factor = 1.9;
                windFactor = 0.15;
                break;
            case 'grass':
            default:
                factor = 0.4;
                windFactor = 0.05;
                break;
        }

        const heating = (radiation / 100) * factor;
        const cooling = wind * windFactor;
        const tempSurf = tempAir + heating - cooling;

        return parseFloat(Math.max(tempAir, tempSurf).toFixed(1));
    }

    // Retorna o nível de risco fisiológico baseado no IET
    function getRiskLevel(iet) {
        if (iet < 27) return 'low';
        if (iet < 32) return 'moderate';
        if (iet < 37) return 'high';
        return 'critical';
    }

    const riskMeta = {
        low: { label: 'Seguro', class: 'badge-low', color: 'var(--color-low)', desc: 'Condições seguras para passeios.' },
        moderate: { label: 'Atenção', class: 'badge-moderate', color: 'var(--color-moderate)', desc: 'Atenção térmica. Reduza o ritmo e hidrate o animal.' },
        high: { label: 'Alerta', class: 'badge-high', color: 'var(--color-high)', desc: 'Perigo Térmico. Evite sol direto e proteja as patas.' },
        critical: { label: 'Crítico', class: 'badge-critical', color: 'var(--color-critical)', desc: 'Alerta Vermelho! Risco à vida por hipertermia ou colapso.' }
    };

    // --- CONEXÃO COM API LOCAL FASTAPI (OBSERVATÓRIO) ---
    async function fetchLiveWeatherData() {
        try {
            // Tenta consultar a API FastAPI do observatório climático local (porta padrão 8000)
            const response = await fetch('http://localhost:8000/api/sensores');
            if (!response.ok) throw new Error('Falha no status da API local');
            
            const sensorList = await response.json();
            
            apiWeatherData = {};
            sensorList.forEach(sensor => {
                // Normaliza campos para suportar tanto simulated (main_local.py) quanto real DB (main.py)
                const apiBairro = (sensor.sensor_bairro || sensor.bairro || '').toLowerCase();
                
                let matchedId = null;
                Object.keys(stations).forEach(id => {
                    const localBairro = stations[id].bairro.toLowerCase();
                    if (apiBairro.includes(localBairro) || localBairro.includes(apiBairro)) {
                        matchedId = id;
                    }
                });

                if (matchedId) {
                    apiWeatherData[matchedId] = sensor;
                }
            });

            isLiveAPI = true;
            updateConnectionLEDs();
            console.log('[DCPET] Dados meteorológicos da API local carregados com sucesso.');
        } catch (err) {
            isLiveAPI = false;
            updateConnectionLEDs();
            console.warn('[DCPET] API do Observatório não disponível localmente. Utilizando simulação estrutural.');
        }
    }

    function updateConnectionLEDs() {
        const led = document.getElementById('api-led');
        const text = document.getElementById('api-status-text');
        const sidebarType = document.getElementById('sidebar-api-type');
        
        let liveType = 'Simulador';
        if (isPlugfieldConnected) {
            liveType = 'Plugfield API';
            if (led) {
                led.className = 'status-led api-status-live';
                text.textContent = 'API ao Vivo (Plugfield)';
            }
        } else if (isLiveAPI) {
            liveType = 'FastAPI Local';
            if (led) {
                led.className = 'status-led api-status-live';
                text.textContent = 'API ao Vivo (FastAPI)';
            }
        } else {
            if (led) {
                led.className = 'status-led api-status-simulated';
                text.textContent = 'Simulador';
            }
        }
        
        if (sidebarType) {
            sidebarType.textContent = liveType;
        }
    }

    // --- CONEXÃO COM INTEGRAÇÃO PLUGFIELD API ---
    
    function logPlugfield(message) {
        const logsBox = document.getElementById('plugfield-conn-logs');
        if (logsBox) {
            const time = new Date().toLocaleTimeString('pt-BR');
            logsBox.innerHTML += `\n[${time}] ${message}`;
            logsBox.scrollTop = logsBox.scrollHeight;
        }
    }

    async function loginPlugfield(username, password, apiKey) {
        logPlugfield('Iniciando autenticação na Plugfield...');
        try {
            const response = await fetch(`${PLUGFIELD_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('Acesso negado. Chave X-API-KEY inválida.');
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            logPlugfield('Autenticado com sucesso! Token recebido.');
            return data.access_token;
        } catch (e) {
            logPlugfield(`Falha no login: ${e.message}`);
            // Check for potential CORS issues
            if (e.message.includes('Failed to fetch')) {
                logPlugfield('Dica: Possível bloqueio de CORS pelo navegador. A integração funcionará perfeitamente quando hospedada sob o Vercel.');
            }
            throw e;
        }
    }

    async function fetchPlugfieldDevices(token, apiKey) {
        logPlugfield('Buscando dispositivos meteorológicos cadastrados...');
        const response = await fetch(`${PLUGFIELD_BASE_URL}/device?limit=50`, {
            headers: {
                'Authorization': token,
                'x-api-key': apiKey
            }
        });

        if (!response.ok) throw new Error('Falha ao listar dispositivos.');
        const data = await response.json();
        const list = data.deviceList || [];
        logPlugfield(`Sucesso: ${list.length} dispositivos encontrados na API.`);
        return list;
    }

    async function syncPlugfieldCycle() {
        if (!plugfieldAuth) return;
        
        try {
            const devices = await fetchPlugfieldDevices(plugfieldAuth.accessToken, plugfieldAuth.apiKey);
            
            plugfieldWeatherData = {};
            devices.forEach(dev => {
                // Tenta associar à nossa malha de estações comparando nome
                const devName = (dev.deviceName || dev.name || '').toLowerCase();
                let matchedId = null;
                
                Object.keys(stations).forEach(id => {
                    const localBairro = stations[id].bairro.toLowerCase();
                    const localName = stations[id].name.toLowerCase();
                    if (devName.includes(localBairro) || devName.includes(localName) || localBairro.includes(devName)) {
                        matchedId = id;
                    }
                });

                if (matchedId && dev.dashboard) {
                    plugfieldWeatherData[matchedId] = {
                        temperature: dev.dashboard.temp,
                        humidity: dev.dashboard.humi,
                        windSpeed: dev.dashboard.wind,
                        rainAccum12h: dev.dashboard.rainDay,
                        uvIndex: dev.dashboard.uv
                    };
                    logPlugfield(`Mapeado: "${dev.deviceName}" -> Estação ${stations[matchedId].name.replace('DEFESA CIVIL - ', '')}`);
                }
            });

            isPlugfieldConnected = true;
            updatePlugfieldUI(true);
            updateConnectionLEDs();
            
            // Recarregar os elementos visuais do mapa e lista
            updateStationsList();
            renderMapElements();
            updateMapHighlights();
            updateTrendsChart();
            updateMetricsRow();
            
        } catch (e) {
            logPlugfield(`Erro no ciclo de atualização Plugfield: ${e.message}`);
            // Se expirou o token, tentar logar de novo
            if (e.message.includes('Acesso negado') || e.message.includes('401') || e.message.includes('403')) {
                try {
                    const token = await loginPlugfield(plugfieldAuth.username, plugfieldAuth.password, plugfieldAuth.apiKey);
                    plugfieldAuth.accessToken = token;
                    localStorage.setItem('dcpet_plugfield_auth', JSON.stringify(plugfieldAuth));
                    logPlugfield('Token atualizado no cache local.');
                } catch (loginErr) {
                    isPlugfieldConnected = false;
                    updatePlugfieldUI(false);
                    updateConnectionLEDs();
                }
            }
        }
    }

    function updatePlugfieldUI(connected) {
        const badge = document.getElementById('plugfield-conn-badge');
        const led = document.getElementById('plugfield-conn-led');
        const text = document.getElementById('plugfield-conn-text');

        if (!badge) return;

        if (connected) {
            badge.className = 'conn-status-badge is-connected';
            led.className = 'status-led led-green';
            text.textContent = 'Conectado (Tempo Real)';
        } else {
            badge.className = 'conn-status-badge is-disconnected';
            led.className = 'status-led led-red';
            text.textContent = 'Desconectado (Simulação)';
        }
    }

    // Inicialização da Plugfield baseada no localStorage
    async function initPlugfield() {
        const stored = localStorage.getItem('dcpet_plugfield_auth');
        if (stored) {
            try {
                plugfieldAuth = JSON.parse(stored);
                document.getElementById('plugfield-username').value = plugfieldAuth.username;
                document.getElementById('plugfield-password').value = plugfieldAuth.password;
                document.getElementById('plugfield-apikey').value = plugfieldAuth.apiKey;
                
                logPlugfield('Credenciais carregadas do cache local.');
                
                // Se já tem token, tenta sincronizar direto
                if (plugfieldAuth.accessToken) {
                    await syncPlugfieldCycle();
                } else {
                    const token = await loginPlugfield(plugfieldAuth.username, plugfieldAuth.password, plugfieldAuth.apiKey);
                    plugfieldAuth.accessToken = token;
                    localStorage.setItem('dcpet_plugfield_auth', JSON.stringify(plugfieldAuth));
                    await syncPlugfieldCycle();
                }

                // Configurar loop de polling a cada 60s
                if (plugfieldInterval) clearInterval(plugfieldInterval);
                plugfieldInterval = setInterval(syncPlugfieldCycle, 60000);

            } catch (e) {
                logPlugfield('Aguardando novas credenciais válidas.');
                localStorage.removeItem('dcpet_plugfield_auth');
                plugfieldAuth = null;
                isPlugfieldConnected = false;
                updatePlugfieldUI(false);
                updateConnectionLEDs();
            }
        }
    }

    // --- INTERFACE DO USUÁRIO & RENDERIZAÇÃO DADOS ---

    function updateClock() {
        const now = new Date();
        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');
        
        if (timeEl) timeEl.textContent = now.toLocaleTimeString('pt-BR');
        
        if (dateEl) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            const dateStr = now.toLocaleDateString('pt-BR', options);
            dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        }
    }

    // Atualiza a barra de cards superiores com métricas condensadas
    function updateMetricsRow() {
        const hour = new Date().getHours();
        
        // 1. Encontrar mais quente e mais fria
        let hottest = null;
        let coolest = null;
        let totalActive = 0;

        Object.keys(stations).forEach(id => {
            const data = getWeather(id, hour);
            totalActive++;

            if (!hottest || data.ietPet > hottest.ietPet) {
                hottest = { name: stations[id].name.replace('DEFESA CIVIL - ', ''), ietPet: data.ietPet };
            }
            if (!coolest || data.ietPet < coolest.ietPet) {
                coolest = { name: stations[id].name.replace('DEFESA CIVIL - ', ''), ietPet: data.ietPet };
            }
        });

        const cardHottestName = document.getElementById('card-hottest-name');
        const cardHottestTemp = document.getElementById('card-hottest-temp');
        const cardCoolestName = document.getElementById('card-coolest-name');
        const cardCoolestTemp = document.getElementById('card-coolest-temp');
        const cardActiveSensors = document.getElementById('card-active-sensors');

        if (cardHottestName) cardHottestName.textContent = hottest ? hottest.name : '---';
        if (cardHottestTemp) cardHottestTemp.textContent = hottest ? `${hottest.ietPet.toFixed(1)}°C` : '--';
        if (cardCoolestName) cardCoolestName.textContent = coolest ? coolest.name : '---';
        if (cardCoolestTemp) cardCoolestTemp.textContent = coolest ? `${coolest.ietPet.toFixed(1)}°C` : '--';
        if (cardActiveSensors) cardActiveSensors.textContent = `${totalActive} / ${totalActive}`;

        // 2. Definir o Ponto de Atenção Semanal (Maior média semanal de estresse)
        // Simulamos o cálculo de média baseado na maior anomalia local
        let attention = null;
        Object.keys(stations).forEach(id => {
            const config = stations[id];
            const weeklyAvg = getWeather(id, hour).ietPet - 1.0; // simulação de média
            if (!attention || weeklyAvg > attention.avgVal) {
                attention = { name: config.name.replace('DEFESA CIVIL - ', ''), avgVal: weeklyAvg };
            }
        });

        const cardAttentionName = document.getElementById('card-attention-name');
        const cardAttentionVal = document.getElementById('card-attention-val');

        if (cardAttentionName) cardAttentionName.textContent = attention ? attention.name : '---';
        if (cardAttentionVal) cardAttentionVal.textContent = attention ? `Média: ${attention.avgVal.toFixed(1)}°C` : '--';
    }

    // Renderiza a lista de estações oficiais e customizadas na aba de monitoramento
    function updateStationsList() {
        const hour = new Date().getHours();
        const container = document.getElementById('stations-list');
        if (!container) return;
        
        container.innerHTML = '';

        let highestRisk = 'low';

        Object.keys(stations).forEach(id => {
            const data = getWeather(id, hour);
            const config = stations[id];
            const meta = riskMeta[data.riskLevel];

            // Risco acumulado do sistema
            if (data.riskLevel === 'critical') highestRisk = 'critical';
            else if (data.riskLevel === 'high' && highestRisk !== 'critical') highestRisk = 'high';
            else if (data.riskLevel === 'moderate' && highestRisk !== 'critical' && highestRisk !== 'high') highestRisk = 'moderate';

            const card = document.createElement('div');
            card.className = `station-card-light ${id === activeStationId ? 'active' : ''}`;
            card.setAttribute('data-station', id);

            card.innerHTML = `
                <div class="station-card-indicator">
                    <span class="station-card-dot" style="background-color: ${meta.color};"></span>
                    <div class="station-card-info">
                        <h4>${config.name.replace('DEFESA CIVIL - ', '')}</h4>
                        <p>${config.desc || 'Estação Meteorológica'}</p>
                    </div>
                </div>
                <div class="station-card-values">
                    <div class="station-card-metric">
                        Ar: <strong>${data.temperature}°C</strong><br/>
                        Umid: <strong>${data.humidity}%</strong>
                    </div>
                    <div class="station-card-score" style="color: ${meta.color};">
                        ${data.ietPet}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                selectStation(id);
            });

            container.appendChild(card);
        });

        // Atualizar update-time
        const updateTimeEl = document.getElementById('weather-update-time');
        if (updateTimeEl) {
            updateTimeEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
        }

        // Atualizar status do sistema geral na Sidebar
        const sysBadge = document.getElementById('sys-general-status');
        const sidebarLed = document.getElementById('sidebar-led');
        
        if (sysBadge) {
            let statusText = 'ESTÁVEL';
            if (highestRisk === 'critical') {
                statusText = 'ALERTA MÁXIMO';
                sysBadge.className = 'status-label text-red-600';
                if (sidebarLed) sidebarLed.className = 'status-led led-red';
            } else if (highestRisk === 'high') {
                statusText = 'ATENÇÃO CRÍTICA';
                sysBadge.className = 'status-label text-orange-600';
                if (sidebarLed) sidebarLed.className = 'status-led led-orange';
            } else {
                sysBadge.className = 'status-label';
                if (sidebarLed) sidebarLed.className = 'status-led led-green';
            }
            sysBadge.textContent = statusText;
        }
    }

    function selectStation(stationId) {
        activeStationId = stationId;

        document.querySelectorAll('.station-card-light').forEach(card => {
            if (card.getAttribute('data-station') === stationId) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Sincroniza seletor da calculadora
        const simStationSelect = document.getElementById('sim-station');
        if (simStationSelect) simStationSelect.value = stationId;

        // Centraliza mapa Leaflet na estação focada
        if (map && stations[stationId]) {
            map.setView([stations[stationId].lat, stations[stationId].lng], 13);
            if (mapMarkers[stationId]) {
                mapMarkers[stationId].openPopup();
            }
        }

        updateMapHighlights();
        updateTrendsChart();
    }

    function updateMapHighlights() {
        Object.keys(stations).forEach(id => {
            if (mapCircles[id]) {
                const isActive = id === activeStationId;
                mapCircles[id].setStyle({
                    weight: isActive ? 3 : 1.5,
                    opacity: isActive ? 1 : 0.6
                });
            }
        });
    }

    // --- GRÁFICOS DINÂMICOS (CHART.JS) ---
    function updateTrendsChart() {
        const config = stations[activeStationId];
        if (!config) return;

        const focusedNameEl = document.getElementById('focused-station-name');
        if (focusedNameEl) {
            focusedNameEl.textContent = `Estação focada: ${config.name.replace('DEFESA CIVIL - ', '')}`;
        }

        const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const tempAirData = [];
        const tempSurfaceData = [];
        const ietPetData = [];

        for (let h = 0; h < 24; h++) {
            const weather = getWeather(activeStationId, h);
            tempAirData.push(weather.temperature);
            tempSurfaceData.push(weather.tempSurface);
            ietPetData.push(weather.ietPet);
        }

        if (trendsChart) {
            trendsChart.data.datasets[0].data = tempAirData;
            trendsChart.data.datasets[1].data = tempSurfaceData;
            trendsChart.data.datasets[2].data = ietPetData;
            trendsChart.update();
        } else {
            const canvas = document.getElementById('trendsChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            const gradientIET = ctx.createLinearGradient(0, 0, 0, 250);
            gradientIET.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
            gradientIET.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

            trendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Temp. do Ar (°C)',
                            data: tempAirData,
                            borderColor: '#64748b', // Slate 500
                            borderWidth: 1.5,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            fill: false,
                            tension: 0.3
                        },
                        {
                            label: 'Temp. do Solo (Estimado °C)',
                            data: tempSurfaceData,
                            borderColor: '#f97316', // Orange 500
                            borderWidth: 1.5,
                            borderDash: [5, 5],
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            fill: false,
                            tension: 0.3
                        },
                        {
                            label: 'Sensação IET-Pet (°C)',
                            data: ietPetData,
                            borderColor: '#2563eb', // Blue 600
                            borderWidth: 3,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#2563eb',
                            backgroundColor: gradientIET,
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#475569',
                                font: { family: 'Inter', size: 10, weight: '600' },
                                boxWidth: 12,
                                padding: 15
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#0f172a',
                            titleFont: { family: 'Outfit', size: 11, weight: 'bold' },
                            bodyFont: { family: 'Inter', size: 10 },
                            borderWidth: 1,
                            borderColor: '#334155'
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 9 },
                                maxTicksLimit: 12
                            }
                        },
                        y: {
                            grid: { color: '#e2e8f0' },
                            ticks: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 9 },
                                callback: function(value) { return value + '°C'; }
                            }
                        }
                    }
                }
            });
        }
    }

    // --- FORMULÁRIOS DE SELEÇÃO DINÂMICOS ---
    function populateDropdowns() {
        const simSelect = document.getElementById('sim-station');
        const colSelect = document.getElementById('col-micro');
        
        if (simSelect) {
            simSelect.innerHTML = '';
            Object.keys(stations).forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = stations[id].name.replace('DEFESA CIVIL - ', '');
                simSelect.appendChild(opt);
            });
        }

        if (colSelect) {
            colSelect.innerHTML = '';
            Object.keys(stations).forEach(id => {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = stations[id].name.replace('DEFESA CIVIL - ', '');
                colSelect.appendChild(opt);
            });
        }
    }

    // --- SIMULADOR DE PASSEIOS ---
    function runWalkSimulation() {
        const stationId = document.getElementById('sim-station').value;
        const breed = document.getElementById('sim-breed').value;
        const surface = document.getElementById('sim-surface').value;
        const timeSlotKey = document.getElementById('sim-time').value;

        const timeConfig = timeSlots[timeSlotKey];
        const stationConfig = stations[stationId];

        // 1. Obtém o clima da estação no horário simulado
        const weather = getWeather(stationId, timeConfig.hour);

        // 2. Estima a temperatura de superfície
        const tempSurface = estimateSurfaceTemp(weather.temperature, timeConfig.rad, weather.wind, surface);

        // 3. Fatores fisiológicos da raça
        let breedOffset = 0;
        let breedWarningText = '';

        if (breed === 'brachy') {
            breedOffset = 3.0;
            breedWarningText = '🚨 <strong>Braquicefálico:</strong> Dificuldade muito alta de troca de calor pelo ofego. Sob alta umidade de Fortaleza, este animal corre risco de colapso respiratório ou síncope em poucos minutos!';
        } else if (breed === 'double') {
            breedOffset = 2.0;
            breedWarningText = '⚠️ <strong>Pelagem Longa/Dupla:</strong> O pelo atua como um isolador térmico severo que retém o calor corporal interno. Mantenha hidratação forçada e evite o sol a todo custo.';
        } else if (breed === 'hairless') {
            breedWarningText = '☀️ <strong>Sem Pelo:</strong> A pele do animal está totalmente exposta à radiação UV direta. Risco alto de queimaduras de pele severas e dermatites. Evite passeios sob o sol direto.';
        }

        // 4. Calcula o IET-Pet Final com o offset da raça
        const walkIET = calculateIETPet(weather.temperature, weather.humidity, tempSurface, weather.wind) + breedOffset;
        const riskClass = getRiskLevel(walkIET);
        const meta = riskMeta[riskClass];

        // Exibe Gauge
        const simIndexVal = document.getElementById('sim-index-val');
        const simVerdictTitle = document.getElementById('sim-verdict-title');
        const simVerdictDesc = document.getElementById('sim-verdict-desc');

        if (simIndexVal) {
            simIndexVal.textContent = walkIET.toFixed(1);
            simIndexVal.style.color = meta.color;
        }

        const gaugeFill = document.getElementById('sim-gauge-fill');
        if (gaugeFill) {
            gaugeFill.style.stroke = meta.color;
            const minTemp = 20;
            const maxTemp = 45;
            const percent = Math.min(100, Math.max(0, ((walkIET - minTemp) / (maxTemp - minTemp)) * 100));
            const offset = 220 - (220 * percent / 100);
            gaugeFill.style.strokeDashoffset = offset;
        }

        if (simVerdictTitle) {
            simVerdictTitle.textContent = `Risco ${meta.label}`;
            simVerdictTitle.style.color = meta.color;
        }
        if (simVerdictDesc) {
            simVerdictDesc.textContent = meta.desc;
        }

        // Alerta de Chão Quente
        const pawWarning = document.getElementById('paw-warning');
        if (pawWarning) {
            if (tempSurface >= 48) {
                pawWarning.className = 'warning-box warning-box-critical';
                pawWarning.innerHTML = `
                    <i data-lucide="flame" style="color: var(--color-critical);"></i>
                    <div>
                        <strong>Asfalto/Piso Extremamente Quente (${tempSurface}°C)!</strong> Queimaduras de 3º grau nas almofadas das patas podem ocorrer em menos de 60 segundos de contato contínuo. <strong>Não passeie descalço de forma alguma.</strong>
                    </div>
                `;
            } else if (tempSurface >= 38) {
                pawWarning.className = 'warning-box warning-box-moderate';
                pawWarning.innerHTML = `
                    <i data-lucide="alert-triangle" style="color: var(--color-moderate);"></i>
                    <div>
                        <strong>Superfície Quente (${tempSurface}°C).</strong> Desconfortável para caminhadas. Prefira passear na grama ou na sombra e limite o tempo de contato.
                    </div>
                `;
            } else {
                pawWarning.className = 'warning-box warning-box-low';
                pawWarning.innerHTML = `
                    <i data-lucide="check-circle" style="color: var(--color-low);"></i>
                    <div>
                        <strong>Solo Seguro (${tempSurface}°C).</strong> O piso está em temperatura confortável e segura para as patas do animal.
                    </div>
                `;
            }
        }

        // Alertas adicionais de raça
        const resultsBox = document.getElementById('sim-results');
        const previousWarnings = resultsBox.querySelectorAll('.warning-box:not(#paw-warning)');
        previousWarnings.forEach(w => w.remove());

        if (breedWarningText !== '') {
            const breedWarningEl = document.createElement('div');
            breedWarningEl.className = breed === 'brachy' ? 'warning-box warning-box-critical' : 'warning-box warning-box-moderate';
            
            const warnIcon = breed === 'brachy' ? 'alert-circle' : 'info';
            const warnColor = breed === 'brachy' ? 'var(--color-critical)' : 'var(--color-moderate)';
            
            breedWarningEl.innerHTML = `<i data-lucide="${warnIcon}" style="color: ${warnColor};"></i><div>${breedWarningText}</div>`;
            resultsBox.insertBefore(breedWarningEl, document.getElementById('paw-warning'));
        }

        // Recomendações
        const recsContainer = document.getElementById('sim-recs');
        if (recsContainer) {
            recsContainer.innerHTML = '';
            const recList = [];
            
            if (walkIET >= 37) {
                recList.push({ icon: 'x-circle', text: 'Cancele o passeio. Alto risco de morte do pet.' });
                recList.push({ icon: 'droplet', text: 'Forneça água fresca gelada abundante imediatamente.' });
                recList.push({ icon: 'wind', text: 'Mantenha o animal em ar-condicionado ou vento forçado.' });
            } else if (walkIET >= 32) {
                recList.push({ icon: 'umbrella', text: 'Caminhe estritamente em sombras ou parques verdes.' });
                recList.push({ icon: 'droplet', text: 'Ofereça água gelada a cada 5 minutos de passeio.' });
                recList.push({ icon: 'sunset', text: 'Passeios permitidos apenas antes das 7h ou após as 18h.' });
            } else if (walkIET >= 27) {
                recList.push({ icon: 'compass', text: 'Prefira gramados naturais (ex: Parque do Cocó).' });
                recList.push({ icon: 'droplet', text: 'Leve garrafa de água com bebedouro portátil acoplado.' });
            } else {
                recList.push({ icon: 'smile', text: 'Passeio seguro! Divirta-se com seu pet.' });
                recList.push({ icon: 'droplet', text: 'Não se esqueça de manter a hidratação regular.' });
            }

            recList.forEach(rec => {
                const item = document.createElement('div');
                item.className = 'rec-item';
                item.innerHTML = `
                    <i data-lucide="${rec.icon}"></i>
                    <span>${rec.text}</span>
                `;
                recsContainer.appendChild(item);
            });
        }

        lucide.createIcons();
    }

    // --- MONITORAÇÃO DE ANIMAIS DE RUA (COLÔNIAS) ---
    const defaultColonies = [
        { id: 'col-ferreira', name: 'Praça do Ferreira - Centro', size: 12, type: 'gatos', micro: 'st-001', water: true, shade: false },
        { id: 'col-coco', name: 'Parque do Cocó - Cocó', size: 20, type: 'gatos', micro: 'st-008', water: true, shade: true },
        { id: 'col-parangaba', name: 'Terminal da Parangaba', size: 6, type: 'misto', micro: 'st-006', water: false, shade: false }
    ];

    function getColonies() {
        const stored = localStorage.getItem('dcpet_colonies');
        if (!stored) {
            localStorage.setItem('dcpet_colonies', JSON.stringify(defaultColonies));
            return defaultColonies;
        }
        return JSON.parse(stored);
    }

    function updateColoniesTabHighlights() {
        const container = document.getElementById('top-hot-stations-container');
        if (!container) return;

        const hour = new Date().getHours();

        // Ordenar todas as estações pela temperatura real-time atual
        const sorted = Object.keys(stations)
            .map(id => {
                const weather = getWeather(id, hour);
                return {
                    id,
                    name: stations[id].name.replace('DEFESA CIVIL - ', '').replace('IOT - ', ''),
                    bairro: stations[id].bairro,
                    temp: weather.temperature,
                    riskLevel: weather.riskLevel
                };
            })
            .sort((a, b) => b.temp - a.temp)
            .slice(0, 3); // Pegar as 3 maiores

        container.innerHTML = '';

        sorted.forEach(item => {
            const meta = riskMeta[item.riskLevel];
            const config = stations[item.id] || officialStations['st-001'];
            const areas2km = config.areas2km || [config.bairro];
            const miniCard = document.createElement('div');
            miniCard.className = 'hot-station-mini-card';
            miniCard.innerHTML = `
                <div class="hot-station-mini-info">
                    <h4>${item.name}</h4>
                    <p>${item.bairro}</p>
                    <div class="hot-station-influence">Bairros de influência (2 km): <strong>${areas2km.join(', ')}</strong></div>
                </div>
                <div class="hot-station-mini-temp" style="color: ${meta.color};">
                    <i data-lucide="thermometer"></i> ${item.temp.toFixed(1)}°C
                </div>
            `;
            container.appendChild(miniCard);
        });

        lucide.createIcons();
    }

    function renderColonies() {
        const colonies = getColonies();
        const container = document.getElementById('colony-container');
        if (!container) return;
        
        container.innerHTML = '';
        const hour = new Date().getHours();

        colonies.forEach((colony, index) => {
            const item = document.createElement('div');
            item.className = 'colony-card-light';

            const specieText = colony.type === 'gatos' ? 'Gatos Comunitários' : 
                               colony.type === 'caes' ? 'Cães Comunitários' : 'Misto (Cães/Gatos)';
            
            const stationData = getWeather(colony.micro, hour);
            const meta = riskMeta[stationData.riskLevel];
            
            // Buscar os bairros no raio de 2km do sensor
            const config = stations[colony.micro] || officialStations['st-001'];
            const areas2km = config.areas2km || [config.bairro];

            item.innerHTML = `
                <div class="colony-card-info">
                    <h4>${colony.name}</h4>
                    <p>~${colony.size} ${specieText}</p>
                    <p style="font-size: 0.65rem; margin-top: 4px;">Risco Fisiológico Local: <span style="color:${meta.color}; font-weight:700;">${meta.label} (${stationData.ietPet}°C)</span></p>
                    <div class="colony-influence-badge">Bairros de influência (raio de 2 km): <strong>${areas2km.join(', ')}</strong></div>
                </div>
                <div class="colony-card-actions">
                    <button class="colony-btn-action ${colony.water ? 'active' : ''}" data-action="water" data-index="${index}" title="Bebedouro de Água Comunitário">
                        <i data-lucide="droplets"></i> Água
                    </button>
                    <button class="colony-btn-action ${colony.shade ? 'active' : ''}" data-action="shade" data-index="${index}" title="Estrutura de Sombra Física">
                        <i data-lucide="umbrella"></i> Sombra
                    </button>
                </div>
            `;

            container.appendChild(item);
        });

        // Eventos dos botões de ação das colônias
        container.querySelectorAll('.colony-btn-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const index = parseInt(btn.getAttribute('data-index'));
                toggleColonyAction(index, action);
            });
        });

        // Atualizar também o banner de temperaturas
        updateColoniesTabHighlights();

        lucide.createIcons();
    }

    function toggleColonyAction(index, action) {
        const colonies = getColonies();
        if (action === 'water') {
            colonies[index].water = !colonies[index].water;
        } else if (action === 'shade') {
            colonies[index].shade = !colonies[index].shade;
        }
        localStorage.setItem('dcpet_colonies', JSON.stringify(colonies));
        renderColonies();
    }

    // Modal de Cadastro de Colônia
    const colonyModal = document.getElementById('colony-modal');
    
    const openColonyModalBtn = document.getElementById('btn-open-colony-modal');
    if (openColonyModalBtn) {
        openColonyModalBtn.addEventListener('click', () => {
            if (colonyModal) colonyModal.classList.add('open');
        });
    }

    const closeModal = () => {
        if (colonyModal) {
            colonyModal.classList.remove('open');
            document.getElementById('col-name').value = '';
            document.getElementById('col-size').value = '';
        }
    };

    const closeColonyModalBtn = document.getElementById('btn-close-colony-modal');
    if (closeColonyModalBtn) closeColonyModalBtn.addEventListener('click', closeModal);
    
    const cancelColonyBtn = document.getElementById('btn-cancel-colony');
    if (cancelColonyBtn) cancelColonyBtn.addEventListener('click', closeModal);

    const saveColonyBtn = document.getElementById('btn-save-colony');
    if (saveColonyBtn) {
        saveColonyBtn.addEventListener('click', () => {
            const name = document.getElementById('col-name').value.trim();
            const sizeVal = document.getElementById('col-size').value;
            const type = document.getElementById('col-type').value;
            const micro = document.getElementById('col-micro').value;

            if (name === '' || sizeVal === '') {
                alert('Por favor, preencha todos os campos.');
                return;
            }

            const size = parseInt(sizeVal);
            if (isNaN(size) || size <= 0) {
                alert('Quantidade de animais inválida.');
                return;
            }

            const colonies = getColonies();
            colonies.push({
                id: 'col-' + Date.now(),
                name,
                size,
                type,
                micro,
                water: false,
                shade: false
            });

            localStorage.setItem('dcpet_colonies', JSON.stringify(colonies));
            renderColonies();
            closeModal();
        });
    }

    // --- CADASTRO MANUAL DE NOVO SENSOR / ESTAÇÃO ---
    const formAddSensor = document.getElementById('form-add-sensor');
    if (formAddSensor) {
        formAddSensor.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('sensor-name').value.trim();
            const bairro = document.getElementById('sensor-bairro').value.trim();
            const lat = parseFloat(document.getElementById('sensor-lat').value);
            const lng = parseFloat(document.getElementById('sensor-lng').value);
            const temp = parseFloat(document.getElementById('sensor-temp').value);
            const humidity = parseInt(document.getElementById('sensor-hum').value);

            if (isNaN(lat) || isNaN(lng) || isNaN(temp) || isNaN(humidity)) {
                alert('Dados inválidos inseridos no formulário.');
                return;
            }

            const newId = `st-custom-${Date.now()}`;
            const newSensor = {
                name: `IOT - ${name.toUpperCase()}`,
                bairro,
                desc: `Sensor IoT customizado cadastrado na regional`,
                lat,
                lng,
                tempOffset: 0,
                humidityOffset: 0,
                windOffset: 1.5,
                defaultSurface: 'concrete',
                isCustomManual: true,
                isIoT: true,
                manualData: { temp, humidity }
            };

            // Salvar no localStorage
            const stored = localStorage.getItem('dcpet_custom_stations');
            let customs = stored ? JSON.parse(stored) : {};
            customs[newId] = newSensor;
            localStorage.setItem('dcpet_custom_stations', JSON.stringify(customs));

            // Injetar na memória de estações ativas
            stations[newId] = newSensor;

            // Resetar formulário
            formAddSensor.reset();

            // Atualizar UI e Mapa Leaflet
            populateDropdowns();
            updateStationsList();
            renderMapElements();
            selectStation(newId);
            updateMetricsRow();
            updateCustomIoTList();

            alert('Nova estação manual IoT registrada com sucesso na malha!');
        });
    }

    function updateCustomIoTList() {
        const container = document.getElementById('iot-stations-container');
        const countEl = document.getElementById('iot-devices-count');
        if (!container) return;

        // Filtrar apenas estações IoT e customizadas
        const customKeys = Object.keys(stations).filter(id => stations[id].isIoT);
        
        if (countEl) countEl.textContent = `${customKeys.length} Ativos`;

        if (customKeys.length === 0) {
            container.innerHTML = `
                <div class="empty-list-state">
                    <i data-lucide="satellite" style="width: 32px; height: 32px; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                    <p>Nenhum sensor IoT ou Plugfield ativo na malha.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = '';
        const hour = new Date().getHours();

        customKeys.forEach(id => {
            const config = stations[id];
            const data = getWeather(id, hour);
            const meta = riskMeta[data.riskLevel];

            const card = document.createElement('div');
            card.className = 'iot-card-light';

            card.innerHTML = `
                <div class="iot-card-header">
                    <div class="iot-card-title">
                        <h4>${config.name.replace('IOT - ', '')}</h4>
                        <p>${config.lat.toFixed(4)}, ${config.lng.toFixed(4)}</p>
                    </div>
                    <span class="iot-status-dot"></span>
                </div>
                <div class="iot-card-body">
                    <div>
                        <div class="iot-card-temp">${data.temperature.toFixed(1)}°C</div>
                        <div class="iot-card-humidity">
                            <i data-lucide="droplets"></i> ${data.humidity}% UR
                        </div>
                    </div>
                    <div class="iot-card-score">
                        <span class="iot-score-label" style="color: ${meta.color};">Estresse IET-Pet</span>
                        <div class="iot-score-val" style="color: ${meta.color};">${data.ietPet}</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        lucide.createIcons();
    }

    // --- FORMULÁRIO DE CONFIGURAÇÃO PLUGFIELD API ---
    const formPlugfield = document.getElementById('form-plugfield-config');
    if (formPlugfield) {
        formPlugfield.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('plugfield-username').value.trim();
            const password = document.getElementById('plugfield-password').value;
            const apiKey = document.getElementById('plugfield-apikey').value.trim();

            if (!username || !password || !apiKey) {
                alert('Por favor, preencha todas as credenciais da API Plugfield.');
                return;
            }

            try {
                const token = await loginPlugfield(username, password, apiKey);
                
                // Salvar credenciais e token
                plugfieldAuth = { username, password, apiKey, accessToken: token };
                localStorage.setItem('dcpet_plugfield_auth', JSON.stringify(plugfieldAuth));
                
                // Iniciar Polling
                await syncPlugfieldCycle();
                if (plugfieldInterval) clearInterval(plugfieldInterval);
                plugfieldInterval = setInterval(syncPlugfieldCycle, 60000);

                alert('Credenciais salvas com sucesso! Estações Plugfield sincronizadas.');
            } catch (err) {
                alert('Falha na autenticação da Plugfield. Verifique as credenciais nos Logs.');
            }
        });
    }

    const btnClearPlugfield = document.getElementById('btn-clear-plugfield');
    if (btnClearPlugfield) {
        btnClearPlugfield.addEventListener('click', () => {
            localStorage.removeItem('dcpet_plugfield_auth');
            plugfieldAuth = null;
            if (plugfieldInterval) clearInterval(plugfieldInterval);
            plugfieldWeatherData = {};
            isPlugfieldConnected = false;
            
            document.getElementById('plugfield-username').value = '';
            document.getElementById('plugfield-password').value = '';
            document.getElementById('plugfield-apikey').value = '';
            
            logPlugfield('Conexão encerrada pelo usuário. Credenciais removidas.');
            updatePlugfieldUI(false);
            updateConnectionLEDs();
            
            updateStationsList();
            renderMapElements();
            updateMapHighlights();
            updateTrendsChart();
            updateMetricsRow();
        });
    }

    // --- NAVEGAÇÃO DE ABAS DA SIDEBAR ---
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(content => {
                if (content.id === `tab-${tabName}`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            // Sincroniza título do Cabeçalho
            const tabTitles = {
                'map': 'Visão Geral',
                'protocols': 'Protocolo Fisiológico',
                'iot': 'Estações IoT',
                'street-animals': 'Animais de Rua'
            };
            document.getElementById('header-tab-title').textContent = tabTitles[tabName];

            // Reajusta layout do Leaflet quando carregar a aba de mapa
            if (tabName === 'map' && map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 150);
            }
        });
    });

    // --- PROTOCOLO EDUCATIVO: NAVEGAÇÃO INTERNA ---
    document.querySelectorAll('.edu-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.edu-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.edu-tab-content').forEach(content => {
                if (content.id === `tab-${tabName}`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // --- INICIALIZAÇÃO GERAL DA APLICAÇÃO ---
    async function initializeApp() {
        updateClock();
        setInterval(updateClock, 1000);
        
        // 1. Carrega dados customizados locais
        loadCustomStations();
        
        // 2. Preenche select-boxes de estações
        populateDropdowns();

        // 3. Inicializa o Leaflet Map
        initMap();

        // 4. Conecta com a API local FastAPI do Observatório
        await fetchLiveWeatherData();

        // 5. Conecta com a API Plugfield (se existirem credenciais)
        await initPlugfield();

        // 6. Atualizações Periódicas (1 min)
        setInterval(async () => {
            await fetchLiveWeatherData();
            updateStationsList();
            renderMapElements();
            updateMapHighlights();
            updateTrendsChart();
            updateMetricsRow();
            updateCustomIoTList();
        }, 60000);

        // 7. Eventos Auxiliares e Loop Inicial
        document.getElementById('btn-run-simulation').addEventListener('click', runWalkSimulation);

        // Renderizar Colônias de rua
        renderColonies();
        
        // Atualizar lista e cards
        updateStationsList();
        updateMetricsRow();
        updateCustomIoTList();

        // Foca na estação Centro por padrão
        selectStation('st-001');
        
        // Rodar simulação inicial
        runWalkSimulation();
    }

    initializeApp();
});
