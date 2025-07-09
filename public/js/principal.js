// js/principal.js

// Funções da API de Previsão do Tempo (OpenWeatherMap)
/**
 * Busca os dados de previsão do tempo detalhada para 5 dias / 3 horas para uma cidade,
 * AGORA ATRAVÉS DO NOSSO BACKEND PROXY.
 * @async
 * @param {string} cidade - O nome da cidade para buscar a previsão.
 * @returns {Promise<Object|null>} Os dados da API de forecast ou null em caso de erro.
 * @throws {Error} Se a resposta da API não for OK ou houver erro na requisição.
 */
async function buscarPrevisaoDetalhada(cidade) {
    const encodedCidade = encodeURIComponent(cidade);
    // 👇👇👇 CORREÇÃO AQUI: Substitua pela SUA URL pública do Render.com 👇👇👇
    // Exemplo: const backendUrl = `https://meu-backend-garagem.onrender.com/api/previsao/${encodedCidade}`;
    const backendUrl = `https://atividade-b2-p1-a6render.onrender.com/api/previsao/${encodedCidade}`;


    console.log(`[Frontend] Solicitando previsão para: ${cidade} ao backend: ${backendUrl}`);

    try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
            let errorMsg = `Erro ${response.status} ao buscar previsão.`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMsg = errorData.error; // Usa a mensagem de erro do backend se disponível
                }
            } catch (e) {
                // Se o backend não enviar um JSON de erro, ou se o erro não for JSON
                console.warn("[Frontend] Não foi possível parsear JSON da resposta de erro do backend ou backend não enviou JSON de erro esperado.");
            }
            console.error('[Frontend] Erro ao buscar previsão do backend:', errorMsg);
            throw new Error(errorMsg); // Lança o erro com a mensagem mais específica possível
        }

        const data = await response.json();
        console.log('[Frontend] Dados da previsão recebidos do backend:', data);
        return data;
    } catch (error) {
        console.error('[Frontend] Erro em buscarPrevisaoDetalhada (via backend):', error.message);
        // Re-lança o erro para que seja capturado pelo .catch no event listener do botão.
        // error.message aqui será "Failed to fetch" para erros de rede/CORS,
        // ou a errorMsg definida no bloco if (!response.ok) para erros HTTP do backend.
        throw error;
    }
}

/**
 * Processa os dados brutos da API de forecast e agrupa por dia.
 */
function processarDadosForecast(data) {
    if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
        console.error('Dados de forecast inválidos ou lista vazia:', data);
        return [];
    }

    const previsoesPorDia = {};

    data.list.forEach(item => {
        const dia = item.dt_txt.split(' ')[0];
        const hora = item.dt_txt.split(' ')[1];

        if (!previsoesPorDia[dia]) {
            previsoesPorDia[dia] = {
                temps: [],
                descricoes: [],
                icones: [],
                horas: []
            };
        }
        previsoesPorDia[dia].temps.push(item.main.temp);
        previsoesPorDia[dia].descricoes.push(item.weather[0].description);
        previsoesPorDia[dia].icones.push(item.weather[0].icon);
        previsoesPorDia[dia].horas.push(hora);
    });

    const resultadoFinal = [];
    for (const dia in previsoesPorDia) {
        const diaData = previsoesPorDia[dia];
        const temp_min = Math.min(...diaData.temps);
        const temp_max = Math.max(...diaData.temps);

        let indiceRepresentativo = diaData.horas.findIndex(h => h === "12:00:00");
        if (indiceRepresentativo === -1) {
            indiceRepresentativo = Math.floor(diaData.horas.length / 2);
            if(indiceRepresentativo < 0) indiceRepresentativo = 0;
        }

        const descricao = diaData.descricoes[indiceRepresentativo] || diaData.descricoes[0] || "Sem descrição";
        const icone = diaData.icones[indiceRepresentativo] || diaData.icones[0] || "01d";

        resultadoFinal.push({
            data: dia,
            temp_min: parseFloat(temp_min.toFixed(1)),
            temp_max: parseFloat(temp_max.toFixed(1)),
            descricao: descricao.charAt(0).toUpperCase() + descricao.slice(1),
            icone: icone
        });
    }
    console.log('[Frontend] Dados processados:', resultadoFinal);
    return resultadoFinal;
}

/**
 * Exibe a previsão detalhada na interface do usuário.
 */
function exibirPrevisaoDetalhada(previsaoDiariaProcessada, nomeCidade) {
    const resultadosDiv = document.getElementById('previsao-tempo-resultado');
    if (!resultadosDiv) {
        console.error('Elemento #previsao-tempo-resultado não encontrado.');
        return;
    }
    resultadosDiv.innerHTML = '';

    if (!previsaoDiariaProcessada || previsaoDiariaProcessada.length === 0) {
        resultadosDiv.innerHTML = `<p class="erro-clima">Não foi possível obter a previsão para ${nomeCidade}. Tente novamente.</p>`;
        return;
    }

    const titulo = document.createElement('h3');
    titulo.innerHTML = `<i class="fas fa-cloud-sun"></i> Previsão para ${nomeCidade}`;
    resultadosDiv.appendChild(titulo);

    const diasContainer = document.createElement('div');
    diasContainer.className = 'dias-previsao-container';

    previsaoDiariaProcessada.forEach(dia => {
        const diaCard = document.createElement('div');
        diaCard.className = 'dia-previsao-card';

        const dataObj = new Date(dia.data + 'T00:00:00'); // Adiciona T00:00:00 para tratar como UTC
        const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
        const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

        diaCard.innerHTML = `
            <h4>${diaSemana.toUpperCase()}, ${dataFormatada}</h4>
            <img src="https://openweathermap.org/img/wn/${dia.icone}@2x.png" alt="${dia.descricao}" title="${dia.descricao}">
            <p class="descricao-clima">${dia.descricao}</p>
            <p class="temperaturas-clima">
                <span class="temp-max"><i class="fas fa-temperature-high"></i> ${dia.temp_max}°C</span>
                <span class="temp-min"><i class="fas fa-temperature-low"></i> ${dia.temp_min}°C</span>
            </p>
        `;
        diasContainer.appendChild(diaCard);
    });
    resultadosDiv.appendChild(diasContainer);
}

// ======================================================
// @file principal.js
// @description Script principal da Garagem Inteligente com API e todas as ações.
// ======================================================

// --- Cache de Elementos DOM ---
const Cache = {}; // DEFINIÇÃO ÚNICA E CORRETA

// --- Variáveis Globais de Estado ---
let garagem = {};
let veiculoSelecionado = null;
let modoEdicao = false;
let flatpickrInstance = null;
let isInitialized = false; // DEFINIÇÃO ÚNICA E CORRETA de isInitialized

// --- DENTRO DO SEU `DOMContentLoaded` ---
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    isInitialized = true;

    // Cache dos elementos da GARAGEM
    Cache.selecaoVeiculoSection = document.getElementById('selecao-veiculo');
    Cache.detalhesVeiculoContainer = document.getElementById('detalhes-veiculo-container');
    Cache.criarVeiculoSection = document.getElementById('criar-veiculo');
    Cache.informacoesVeiculoSection = document.getElementById('informacoes-veiculo');
    Cache.acoesVeiculoSection = document.getElementById('acoes-veiculo');
    Cache.musicaVeiculoSection = document.getElementById('musica-veiculo');
    Cache.manutencaoVeiculoSection = document.getElementById('manutencao-veiculo');
    Cache.tipoSelecionadoInfoDiv = document.getElementById('tipoSelecionadoInfo');
    Cache.criarModificarTituloH2 = document.getElementById('criarModificarTitulo');
    Cache.formCriarModificar = document.getElementById('formCriarModificar');
    Cache.modeloInput = document.getElementById('modelo'); Cache.corInput = document.getElementById('cor');
    Cache.nicknameInput = document.getElementById('nickname'); Cache.imagemInput = document.getElementById('imagem');
    Cache.campoCapacidadeCargaDiv = document.getElementById('campoCapacidadeCarga');
    Cache.capacidadeCargaInput = document.getElementById('capacidadeCarga');
    Cache.campoEnvergaduraDiv = document.getElementById('campoEnvergadura');
    Cache.envergaduraInput = document.getElementById('envergadura');
    Cache.campoTipoBicicletaDiv = document.getElementById('campoTipoBicicleta');
    Cache.tipoBicicletaSelect = document.getElementById('tipoBicicleta');
    Cache.btnCriarVeiculo = document.getElementById('btnCriarVeiculo');
    Cache.btnCancelarModificar = document.getElementById('btnCancelarModificar');
    Cache.informacoesVeiculoDiv = document.getElementById('informacoesVeiculo');
    Cache.nicknameDisplaySpan = document.getElementById('nicknameDisplay');
    Cache.imagemExibidaImg = document.getElementById('imagemExibida');
    Cache.statusVeiculoDiv = document.getElementById('statusVeiculo');
    Cache.velocidadeValorSpan = document.getElementById('velocidadeValor');
    Cache.progressoVelocidadeDiv = document.getElementById('progressoVelocidade');
    Cache.fuelDisplayContainerDiv = document.getElementById('fuelDisplayContainer');
    Cache.fuelLevelValorSpan = document.getElementById('fuelLevelValor');
    Cache.fuelLevelBarDiv = document.getElementById('fuelLevelBar');
    Cache.cargaAtualDisplayDiv = document.getElementById('cargaAtualDisplay');
    Cache.cargaAtualValorSpan = document.getElementById('cargaAtualValor');
    Cache.altitudeDisplayDiv = document.getElementById('altitudeDisplay');
    Cache.altitudeValorSpan = document.getElementById('altitudeValor');
    Cache.btnMostrarModificarForm = document.getElementById('btnMostrarModificarForm');
    Cache.musicaInputElement = document.getElementById('musicaInput');
    Cache.btnTocarMusica = document.getElementById('btnTocarMusica');
    Cache.btnPararMusica = document.getElementById('btnPararMusica');
    Cache.nomeMusicaDiv = document.getElementById('nomeMusica');
    Cache.historicoManutencaoListaDiv = document.getElementById('historicoManutencaoLista');
    Cache.agendamentosFuturosListaDiv = document.getElementById('agendamentosFuturosLista');
    Cache.formAgendarManutencao = document.getElementById('formAgendarManutencao');
    Cache.manutencaoDataInput = document.getElementById('manutencaoData');
    Cache.manutencaoTipoInput = document.getElementById('manutencaoTipo');
    Cache.manutencaoCustoInput = document.getElementById('manutencaoCusto');
    Cache.manutencaoDescricaoTextarea = document.getElementById('manutencaoDescricao');
    Cache.notificationAreaDiv = document.getElementById('notification-area');
    Cache.anoAtualSpan = document.getElementById('anoAtual');
    if(Cache.anoAtualSpan) Cache.anoAtualSpan.textContent = new Date().getFullYear();

    Cache.secaoDetalhesExtrasAPIDiv = document.getElementById('secaoDetalhesExtrasAPI');
    Cache.detalhesExtrasVeiculoContentDiv = document.getElementById('detalhesExtrasVeiculoContent');
    Cache.btnFecharDetalhesAPI = document.getElementById('btnFecharDetalhesAPI');

    if (Cache.acoesVeiculoSection && !Cache.acoesVeiculoSection.querySelector('button[data-acao="verDetalhesAPI"]')) {
        const btnVerDetalhesAPI = document.createElement('button');
        btnVerDetalhesAPI.dataset.acao = 'verDetalhesAPI';
        btnVerDetalhesAPI.innerHTML = '<i class="fas fa-cogs"></i> Detalhes API';
        btnVerDetalhesAPI.title = 'Consultar detalhes da API (JSON local)';
        hideElement(btnVerDetalhesAPI);
        Cache.acoesVeiculoSection.appendChild(btnVerDetalhesAPI);
    }

    // Inicialização da GARAGEM
    if (typeof Constants === 'undefined') { showNotification("Erro crítico: Constants não definido.", "error", 10000); return; }
    carregarGaragem();
    if (typeof flatpickr === "function" && Cache.manutencaoDataInput) {
        flatpickrInstance = flatpickr(Cache.manutencaoDataInput, { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", locale: (flatpickr.l10ns && flatpickr.l10ns.pt) ? flatpickr.l10ns.pt : 'default' });
    } else { console.warn("Flatpickr não inicializado."); if(Cache.manutencaoDataInput) Cache.manutencaoDataInput.type = 'date';}
    
    setupEventListeners();
    updateUIForSelectedVehicle(); 
    showNotification("Garagem Inteligente Pronta!", "success", 2000);

    // Configuração da PREVISÃO DO TEMPO
    const cidadeInput = document.getElementById('cidade-previsao-input');
    const verificarClimaBtn = document.getElementById('verificar-clima-btn');
    const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado');

    if (verificarClimaBtn && cidadeInput && previsaoResultadoDiv) {
        verificarClimaBtn.addEventListener('click', async () => {
            const cidade = cidadeInput.value.trim();
            if (!cidade) {
                previsaoResultadoDiv.innerHTML = '<p class="erro-clima">Por favor, digite o nome de uma cidade.</p>';
                cidadeInput.focus();
                return;
            }
            previsaoResultadoDiv.innerHTML = '<p class="carregando-clima"><i class="fas fa-spinner fa-spin"></i> Carregando previsão...</p>';
            try {
                const dadosApi = await buscarPrevisaoDetalhada(cidade); // Chama a função corrigida
                if (dadosApi) {
                    const previsaoProcessada = processarDadosForecast(dadosApi);
                    exibirPrevisaoDetalhada(previsaoProcessada, cidade);
                } else {
                    previsaoResultadoDiv.innerHTML = `<p class="erro-clima">Não foi possível obter a previsão para ${cidade} (dados não retornados).</p>`;
                }
            } catch (error) {
                console.error('[Frontend] Erro ao obter e exibir previsão (capturado no event listener):', error);
                previsaoResultadoDiv.innerHTML = `<p class="erro-clima">Falha ao buscar previsão para ${cidade}: ${error.message}.</p>`;
            }
        });
    } else {
        console.warn('Elementos da previsão do tempo não encontrados. Verifique os IDs no HTML: cidade-previsao-input, verificar-clima-btn, previsao-tempo-resultado');
    }
});

// IDs para mapeamento com dados_veiculos_api.json
const idApiPorTipo = {
    carro: 1,
    caminhao: 2,
    aviao: 3,
    esportivo: 4,
    moto: 5,
    bicicleta: 6
};

// --- Função de Busca na API (JSON Local) ---
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
    const idNumerico = parseInt(identificadorVeiculo, 10);
    if (isNaN(idNumerico)) {
    console.error("[API] Identificador inválido:", identificadorVeiculo);
    showNotification("ID inválido para consulta na API.", "error");
    return null;
    }

    if (!Cache.detalhesExtrasVeiculoContentDiv) {
        console.error("[API] Área 'detalhesExtrasVeiculoContentDiv' não encontrada.");
        showNotification("Erro interno: Área de detalhes da API não configurada.", "error");
        return null;
    }
    Cache.detalhesExtrasVeiculoContentDiv.innerHTML = '<p class="api-loading-message"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes da API...</p>';
    showElement(Cache.secaoDetalhesExtrasAPIDiv);

    try {
    const response = await fetch('./dados_veiculos_api.json');
    if (!response.ok) {
        let errorMsg = `Erro HTTP: ${response.status} - ${response.statusText}.`;
        if (response.status === 404) {
            errorMsg += " Verifique se 'dados_veiculos_api.json' existe na raiz do projeto.";
        }
        throw new Error(errorMsg);
    }
    const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.error("[API Sim] Resposta recebida não é JSON:", textResponse.substring(0, 300) + "...");
            throw new TypeError(`A resposta de 'dados_veiculos_api.json' não está no formato JSON. Conteúdo recebido: ${textResponse.substring(0,100)}...`);
        }
    const veiculosDetalhes = await response.json();
    const detalhes = veiculosDetalhes.find(v => v.id === idNumerico);
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400)); // Simula latência
    return detalhes || null;
    } catch (error) {
    console.error('[API] Falha ao buscar/processar detalhes:', error);
    if (Cache.detalhesExtrasVeiculoContentDiv) {
        Cache.detalhesExtrasVeiculoContentDiv.innerHTML = `<p class="api-error-message"><i class="fas fa-exclamation-triangle"></i> Falha ao carregar: ${error.message}</p>`;
    }
    showNotification("Falha ao consultar API: " + error.message.substring(0,100), "error", 5000);
    return null;
    }
}

// --- Funções Utilitárias Globais ---
function showNotification(message, type = 'info', duration) {
    const defaultDuration = (typeof Constants !== 'undefined' && Constants.NOTIFICATION_DURATION) ? Constants.NOTIFICATION_DURATION : 3000;
    const finalDuration = duration ?? defaultDuration;
    if (!Cache.notificationAreaDiv) {
        console.warn("Área de notificação não encontrada.", `[${type}] ${message}`);
        alert(`[${type}] ${message}`); return;
    }
    try {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        else if (type === 'error') iconClass = 'fa-times-circle';
        else if (type === 'warning') iconClass = 'fa-exclamation-triangle';
        notification.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
        notification.onclick = () => notification.remove();
        
        if (Cache.notificationAreaDiv.firstChild) {
            Cache.notificationAreaDiv.insertBefore(notification, Cache.notificationAreaDiv.firstChild);
        } else {
            Cache.notificationAreaDiv.appendChild(notification);
        }

        void notification.offsetWidth; // Force reflow
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(110%)'; // Slide out to the right
            setTimeout(() => notification.remove(), 500); // Remove after animation
        }, finalDuration);
    } catch (error) { console.error("Erro ao exibir notificação:", error); }
}

function playSound(_nomeSom, _volume) { /* Sons desativados ou implementar aqui */ }

function updateManutencaoUI(veiculo) {
    const histDiv = Cache.historicoManutencaoListaDiv;
    const agenDiv = Cache.agendamentosFuturosListaDiv;
    const defaultMsg = "<p>Nenhum registro.</p>";
    if (veiculo instanceof Veiculo) { // Assumindo que Veiculo é uma classe definida em outro lugar
        if (histDiv) histDiv.innerHTML = veiculo.getHistoricoFormatado() || defaultMsg;
        if (agenDiv) agenDiv.innerHTML = veiculo.getAgendamentosFormatados() || defaultMsg;
        verificarLembretesManutencao(veiculo);
    } else {
        if (histDiv) histDiv.innerHTML = defaultMsg;
        if (agenDiv) agenDiv.innerHTML = defaultMsg;
    }
}

function updateDisplayContent(veiculo) {
    if (!(veiculo instanceof Veiculo)) { // Assumindo que Veiculo é uma classe definida
        if(Cache.informacoesVeiculoDiv) Cache.informacoesVeiculoDiv.innerHTML = "<p>Nenhum veículo para exibir detalhes.</p>";
        if(Cache.acoesVeiculoSection) {
            const h2 = Cache.acoesVeiculoSection.querySelector('h2');
            Cache.acoesVeiculoSection.innerHTML = ""; // Limpa botões antigos
            if(h2) Cache.acoesVeiculoSection.appendChild(h2); // Readiciona o título H2
            const p = document.createElement('p');
            p.textContent = "Selecione um veículo.";
            Cache.acoesVeiculoSection.appendChild(p);
        }
        hideElement(Cache.musicaVeiculoSection);
        hideElement(Cache.manutencaoVeiculoSection);
        hideElement(Cache.secaoDetalhesExtrasAPIDiv);
        return;
    }

    const updateText = (el, txt) => { if (el) el.textContent = txt; };
    const updateHTML = (el, html) => { if (el) el.innerHTML = html; };
    const updateDisp = (el, disp, flex = false) => {
        if (el) el.style.display = disp === 'none' ? 'none' : (flex ? 'flex' : 'block');
    };

    updateHTML(Cache.informacoesVeiculoDiv, veiculo.exibirInformacoes());
    updateText(Cache.nicknameDisplaySpan, veiculo.nickname ? `(${veiculo.nickname})` : '');
    if (Cache.imagemExibidaImg) {
        updateDisp(Cache.imagemExibidaImg, veiculo.imagem ? 'block' : 'none');
        if (veiculo.imagem) { Cache.imagemExibidaImg.src = veiculo.imagem; Cache.imagemExibidaImg.alt = `Imagem de ${veiculo.getIdentifier()}`; }
    }
    updateStatusVeiculo(veiculo);
    updateVelocidadeDisplay(veiculo.velocidade);

    const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
    const isCarroEsportivoClassDefined = typeof CarroEsportivo !== 'undefined';
    const isCaminhaoClassDefined = typeof Caminhao !== 'undefined';
    const isAviaoClassDefined = typeof Aviao !== 'undefined';

    const isBike = isBicicletaClassDefined && veiculo instanceof Bicicleta;
    const isEsportivo = isCarroEsportivoClassDefined && veiculo instanceof CarroEsportivo;
    const isCaminhao = isCaminhaoClassDefined && veiculo instanceof Caminhao;
    const isAviao = isAviaoClassDefined && veiculo instanceof Aviao;

    updateDisp(Cache.fuelDisplayContainerDiv, !isBike, true);
    if (!isBike && Cache.fuelLevelValorSpan && Cache.fuelLevelBarDiv) {
        const cap = (veiculo.fuelCapacity !== undefined && veiculo.fuelCapacity > 0) ? veiculo.fuelCapacity : 1; // Evitar divisão por zero
        const lvl = veiculo.fuelLevel ?? 0;
        const perc = Math.max(0, Math.min(100, Math.round((lvl / cap) * 100)));
        updateText(Cache.fuelLevelValorSpan, perc.toString());
        Cache.fuelLevelBarDiv.style.width = `${perc}%`;
        Cache.fuelLevelBarDiv.className = 'barra-progresso fuel-bar'; // Reset classes
        if (perc < 20) Cache.fuelLevelBarDiv.classList.add('fuel-low');
        else if (perc < 50) Cache.fuelLevelBarDiv.classList.add('fuel-medium');
    }

    updateDisp(Cache.cargaAtualDisplayDiv, isCaminhao, true);
    if (isCaminhao && Cache.cargaAtualValorSpan) updateText(Cache.cargaAtualValorSpan, `${veiculo.cargaAtual ?? 0}kg / ${veiculo.capacidadeCarga ?? 0}kg`);

    updateDisp(Cache.altitudeDisplayDiv, isAviao, true);
    if (isAviao && Cache.altitudeValorSpan) updateText(Cache.altitudeValorSpan, `${veiculo.altitude ?? 0} m`);

    updateDisp(Cache.musicaVeiculoSection, !isBike);
    if(!isBike && Cache.nomeMusicaDiv) updateText(Cache.nomeMusicaDiv, `Música: ${veiculo.musicaNome || 'Nenhuma'}`);


    const todosBotoesAcao = Cache.acoesVeiculoSection.querySelectorAll('button[data-acao]');
    todosBotoesAcao.forEach(btn => hideElement(btn)); // Esconde todos primeiro

    const showActionButton = (acao) => {
        const btn = Cache.acoesVeiculoSection.querySelector(`button[data-acao="${acao}"]`);
        if (btn) showElement(btn, 'inline-flex');
    };

    // Ações comuns
    showActionButton('acelerar');
    showActionButton('frear');
    showActionButton('buzinar');

    if (!isBike) {
        showActionButton('ligar');
        showActionButton('desligar');
        showActionButton('reabastecer');
        if (!(isEsportivo && veiculo.turboAtivado)) { // Só mostra turbo se não estiver ativo
            showActionButton('turbo');
        }
    }

    if (isCaminhao) { showActionButton('carregar'); showActionButton('descarregar'); }
    if (isAviao) { showActionButton('decolar'); showActionButton('aterrissar'); }
    
    const btnApi = Cache.acoesVeiculoSection.querySelector('button[data-acao="verDetalhesAPI"]');
    if (btnApi) { // Garante que o botão foi criado
        if (veiculo.id_api) {
            btnApi.dataset.veiculoIdApi = veiculo.id_api; // Define o ID para o botão da API
            showElement(btnApi, 'inline-flex');
        } else {
            hideElement(btnApi);
        }
    }
}

function salvarGaragem() {
    try {
        const dataToSave = Object.entries(garagem).reduce((acc, [key, veiculoInstance]) => {
            if (veiculoInstance instanceof Veiculo && typeof veiculoInstance.toPlainObject === 'function') {
                acc[key] = veiculoInstance.toPlainObject();
            } else { acc[key] = null; } // Garante que tipos desconhecidos não quebrem
            return acc;
        }, {});
        localStorage.setItem(Constants.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) { console.error("Erro CRÍTICO ao salvar garagem:", e); showNotification("ERRO GRAVE: Não foi possível salvar dados!", 'error', 6000); }
}

function updateVelocidadeDisplay(velocidade) {
    if (!Cache.velocidadeValorSpan || !Cache.progressoVelocidadeDiv) return;
    const vel = Math.max(0, velocidade ?? 0);
    Cache.velocidadeValorSpan.textContent = Math.round(vel).toString();
    const maxV = (typeof Constants !== 'undefined' ? Constants.MAX_VISUAL_SPEED : 200);
    Cache.progressoVelocidadeDiv.style.width = `${Math.min(100, (vel / maxV) * 100)}%`;
}

function updateStatusVeiculo(veiculo) {
    if (!Cache.statusVeiculoDiv) return;
    let text = "N/A"; let className = "status-desligado";
    const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
    if (isBicicletaClassDefined && veiculo instanceof Bicicleta) { text = "Pronta"; className = "status-pronta"; }
    else if (veiculo instanceof Veiculo) { text = veiculo.ligado ? "Ligado" : "Desligado"; className = veiculo.ligado ? "status-ligado" : "status-desligado"; }
    Cache.statusVeiculoDiv.textContent = text;
    Cache.statusVeiculoDiv.className = `status-veiculo ${className}`;
}

function verificarLembretesManutencao(veiculo) {
    if (!(veiculo instanceof Veiculo) || !Array.isArray(veiculo.historicoManutencao)) return;
    try {
        const hoje = new Date(); hoje.setUTCHours(0,0,0,0);
        const amanha = new Date(hoje); amanha.setUTCDate(hoje.getUTCDate() + 1);
        veiculo.historicoManutencao.filter(m => m instanceof Manutencao && m.isAgendamento()).forEach(m => { // Assumindo que Manutencao é uma classe
            const dataM = m.getDataObj(); // Supondo que Manutencao tem um getDataObj()
            if (dataM.getTime() === hoje.getTime()) showNotification(`LEMBRETE HOJE: ${m.tipo} p/ ${veiculo.getIdentifier()}`, 'warning', 7000);
            else if (dataM.getTime() === amanha.getTime()) showNotification(`LEMBRETE AMANHÃ: ${m.tipo} p/ ${veiculo.getIdentifier()}`, 'info', 7000);
        });
    } catch (error) { console.error("Erro ao verificar lembretes:", error); }
}

function carregarGaragem() {
    const garagemBase = { carro: null, esportivo: null, caminhao: null, aviao: null, moto: null, bicicleta: null };
    if (typeof Constants === 'undefined' || !Constants.STORAGE_KEY) {
        showNotification("Erro config: Chave de armaz. faltando.", "error"); garagem = {...garagemBase}; return;
    }
    garagem = {...garagemBase}; // Inicia com a estrutura base
    let dadosSalvos;
    try { dadosSalvos = localStorage.getItem(Constants.STORAGE_KEY); if (!dadosSalvos) return; }
    catch (error) { showNotification("Erro ao acessar dados salvos.", "error"); return; }

    let garagemSalva;
    try { garagemSalva = JSON.parse(dadosSalvos); if (typeof garagemSalva !== 'object' || garagemSalva === null) throw new Error("Dados salvos inválidos."); }
    catch (e) { showNotification("ERRO: Dados salvos corrompidos. Resetando.", 'error', 6000); try { localStorage.removeItem(Constants.STORAGE_KEY); } catch (ign) {} garagem = {...garagemBase}; return; }

    for (const tipo in garagemBase) { // Itera sobre os tipos esperados
        if (!Object.hasOwn(garagemSalva, tipo) || !garagemSalva[tipo]) continue; // Pula se não existir ou for nulo
        const vd = garagemSalva[tipo];
        try {
            if (typeof Manutencao === 'undefined' || typeof Veiculo === 'undefined') throw new Error("Classes base não carregadas.");
            const hist = (Array.isArray(vd.historicoManutencao) ? vd.historicoManutencao : []).map(m => Manutencao.fromPlainObject(m)).filter(Boolean);
            const { modelo='?', cor='?', tipoVeiculo, nickname=null, imagem=null, ligado=false, velocidade=0,
                    fuelLevel = vd.fuelCapacity || (typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL : 50),
                    fuelCapacity = vd.fuelCapacity || (typeof Constants !== 'undefined' ? Constants.FUEL_CAPACITY : 100),
                    volume = (typeof Constants !== 'undefined' ? Constants.DEFAULT_VOLUME : 0.5), musicaNome = "Nenhuma",
                    turboAtivado=false, capacidadeCarga=0, cargaAtual=0, envergadura=0, altitude=0, voando=false, tipo: tipoBike='urbana',
                    id_api = vd.id_api || idApiPorTipo[tipo] || null // Adiciona fallback para id_api
                } = vd;
            if (!tipoVeiculo) throw new Error(`'tipoVeiculo' ausente para ${tipo}`);
            let vr = null;

            // Verifica se as classes específicas estão definidas
            const CarroDef = typeof Carro !== 'undefined';
            const CarroEsportivoDef = typeof CarroEsportivo !== 'undefined';
            const CaminhaoDef = typeof Caminhao !== 'undefined';
            const AviaoDef = typeof Aviao !== 'undefined';
            const MotoDef = typeof Moto !== 'undefined';
            const BicicletaDef = typeof Bicicleta !== 'undefined';

            if (tipoVeiculo === 'Carro' && CarroDef) vr = new Carro(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, hist, id_api);
            else if (tipoVeiculo === 'CarroEsportivo' && CarroEsportivoDef) vr = new CarroEsportivo(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, hist, turboAtivado, id_api);
            else if (tipoVeiculo === 'Caminhao' && CaminhaoDef) vr = new Caminhao(modelo, cor, nickname, capacidadeCarga, imagem, ligado, velocidade, fuelLevel, hist, cargaAtual, id_api);
            else if (tipoVeiculo === 'Aviao' && AviaoDef) vr = new Aviao(modelo, cor, nickname, envergadura, imagem, ligado, velocidade, fuelLevel, hist, altitude, voando, id_api);
            else if (tipoVeiculo === 'Moto' && MotoDef) vr = new Moto(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, hist, id_api);
            else if (tipoVeiculo === 'Bicicleta' && BicicletaDef) vr = new Bicicleta(modelo, cor, nickname, tipoBike, imagem, velocidade, hist, id_api);
            else { console.warn(`Classe para tipoVeiculo '${tipoVeiculo}' não encontrada ou tipo desconhecido.`); continue; }

            if (vr instanceof Veiculo) {
                vr.volume = volume; vr.musicaNome = musicaNome; vr.fuelCapacity = fuelCapacity;
                garagem[tipo] = vr; // Atribui à garagem
            } else { throw new Error(`Falha ao recriar ${tipo} (${tipoVeiculo}).`); }
        } catch (error) { console.error(`Erro ao processar ${tipo} salvo:`, error, vd); showNotification(`Erro ao carregar ${tipo}.`, 'error'); }
    }
}

function showElement(element, displayType = 'block') { if (element) element.style.display = displayType; }
function hideElement(element) { if (element) element.style.display = 'none'; }

function showVehicleCreationView() {
    if (!veiculoSelecionado) return;
    const tipoTxt = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if (Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoTxt} (Novo)`;
    showElement(Cache.criarVeiculoSection);
    hideElement(Cache.informacoesVeiculoSection); hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection); hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm); hideElement(Cache.btnCancelarModificar);
    hideElement(Cache.secaoDetalhesExtrasAPIDiv);
    const btnApi = Cache.acoesVeiculoSection?.querySelector('button[data-acao="verDetalhesAPI"]');
    if (btnApi) hideElement(btnApi);

    modoEdicao = false;
    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Criar Novo ${tipoTxt}`;
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.innerHTML = '<i class="fas fa-plus-circle"></i> Criar Veículo';
    resetCreateForm(); configureCreateFormFields(veiculoSelecionado);
    if (Cache.informacoesVeiculoDiv) Cache.informacoesVeiculoDiv.textContent = 'Preencha os dados para criar.';
    if (Cache.nicknameDisplaySpan) Cache.nicknameDisplaySpan.textContent = '';
    if (Cache.imagemExibidaImg) hideElement(Cache.imagemExibidaImg);
    updateVelocidadeDisplay(0); updateStatusVeiculo(null); updateManutencaoUI(null);
    const isBike = veiculoSelecionado === 'bicicleta';
    if(Cache.fuelDisplayContainerDiv) Cache.fuelDisplayContainerDiv.style.display = isBike ? 'none' : 'flex';
    if(Cache.cargaAtualDisplayDiv) hideElement(Cache.cargaAtualDisplayDiv);
    if(Cache.altitudeDisplayDiv) hideElement(Cache.altitudeDisplayDiv);
}

function showVehicleDetailsView(veiculo) {
    if (!veiculo) return;
    const tipoTxt = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if (Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoTxt} (${veiculo.getIdentifier()})`;
    hideElement(Cache.criarVeiculoSection);
    showElement(Cache.informacoesVeiculoSection); showElement(Cache.acoesVeiculoSection);
    showElement(Cache.manutencaoVeiculoSection);
    showElement(Cache.btnMostrarModificarForm, 'inline-flex'); hideElement(Cache.btnCancelarModificar);
    hideElement(Cache.secaoDetalhesExtrasAPIDiv); // Esconde por padrão
    if (Cache.detalhesExtrasVeiculoContentDiv) Cache.detalhesExtrasVeiculoContentDiv.innerHTML = '<p>Clique em "Detalhes API" para carregar.</p>';
    const isBike = typeof Bicicleta !== 'undefined' && veiculo instanceof Bicicleta;
    if (Cache.musicaVeiculoSection) Cache.musicaVeiculoSection.style.display = isBike ? 'none' : 'block';
    modoEdicao = false;
    updateDisplayContent(veiculo); updateManutencaoUI(veiculo);
    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoTxt}`; // Título para formulário de modificação
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.innerHTML = '<i class="fas fa-save"></i> Salvar Modificações'; // Texto do botão para formulário de modificação
}

function showVehicleModificationView(veiculo) {
    if (!veiculo) return;
    const tipoTxt = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    modoEdicao = true;
    hideElement(Cache.informacoesVeiculoSection); hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection); hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm); hideElement(Cache.secaoDetalhesExtrasAPIDiv);
    const btnApi = Cache.acoesVeiculoSection?.querySelector('button[data-acao="verDetalhesAPI"]');
    if (btnApi) hideElement(btnApi);

    showElement(Cache.criarVeiculoSection); showElement(Cache.btnCancelarModificar, 'inline-flex');
    prefillModifyForm(veiculo); configureCreateFormFields(veiculoSelecionado);
    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoTxt} (${veiculo.getIdentifier()})`;
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.innerHTML = '<i class="fas fa-save"></i> Salvar Modificações';
    document.getElementById('image-help-text')?.remove(); // Remove texto de ajuda anterior
    if (Cache.imagemInput?.parentNode) {
        const help = document.createElement('small'); help.id = 'image-help-text';
        help.textContent = ' Deixe vazio para manter a imagem atual.'; help.style.cssText = 'display:block;font-size:0.8em;color:#666;margin-top:-10px;margin-bottom:10px;';
        Cache.imagemInput.parentNode.insertBefore(help, Cache.imagemInput.nextSibling);
    }
}

function updateUIForSelectedVehicle() {
    if (!Cache.detalhesVeiculoContainer || !Cache.tipoSelecionadoInfoDiv) { showNotification("Erro interno da UI.", "error"); return; }
    document.getElementById('image-help-text')?.remove(); // Remove texto de ajuda
    configureCreateFormFields(null); // Reseta campos específicos
    modoEdicao = false; // Reseta modo de edição
    hideElement(Cache.secaoDetalhesExtrasAPIDiv); // Esconde detalhes da API
    if (!veiculoSelecionado) {
        hideElement(Cache.detalhesVeiculoContainer);
        Cache.tipoSelecionadoInfoDiv.textContent = 'Nenhum tipo selecionado.';
        return;
    }
    showElement(Cache.detalhesVeiculoContainer);
    const veiculo = garagem[veiculoSelecionado];
    if (veiculo instanceof Veiculo) showVehicleDetailsView(veiculo); // Assumindo que Veiculo é uma classe
    else showVehicleCreationView();
}

function configureCreateFormFields(tipo) {
    document.querySelectorAll('.campo-especifico').forEach(el => hideElement(el)); // Esconde todos os campos específicos
    if (tipo === 'caminhao' && Cache.campoCapacidadeCargaDiv) showElement(Cache.campoCapacidadeCargaDiv);
    if (tipo === 'aviao' && Cache.campoEnvergaduraDiv) showElement(Cache.campoEnvergaduraDiv);
    if (tipo === 'bicicleta' && Cache.campoTipoBicicletaDiv) showElement(Cache.campoTipoBicicletaDiv);
}

function resetCreateForm() {
    const form = Cache.formCriarModificar; if (form?.reset) form.reset();
    if (Cache.imagemInput) Cache.imagemInput.value = ''; // Limpa o input de arquivo
    if (Cache.tipoBicicletaSelect) Cache.tipoBicicletaSelect.selectedIndex = 0; // Reseta select
    document.getElementById('image-help-text')?.remove(); // Remove texto de ajuda
}

function prefillModifyForm(veiculo) {
    if (!veiculo) return;
    const setVal = (el, val) => { if (el) el.value = val ?? ''; }; // Lida com valores nulos
    setVal(Cache.modeloInput, veiculo.modelo); setVal(Cache.corInput, veiculo.cor);
    setVal(Cache.nicknameInput, veiculo.nickname); setVal(Cache.imagemInput, ''); // Imagem sempre vazia para nova escolha
    if (typeof Caminhao !== 'undefined' && veiculo instanceof Caminhao) setVal(Cache.capacidadeCargaInput, veiculo.capacidadeCarga);
    if (typeof Aviao !== 'undefined' && veiculo instanceof Aviao) setVal(Cache.envergaduraInput, veiculo.envergadura);
    if (typeof Bicicleta !== 'undefined' && veiculo instanceof Bicicleta) setVal(Cache.tipoBicicletaSelect, veiculo.tipo);
}

function setupEventListeners() {
    Cache.selecaoVeiculoSection?.addEventListener('click', (e) => {
        if (e.target.matches('button[data-tipo]')) {
            const tipo = e.target.dataset.tipo;
            if (tipo !== veiculoSelecionado) { veiculoSelecionado = tipo; updateUIForSelectedVehicle(); }
        }
    });
    Cache.btnMostrarModificarForm?.addEventListener("click", () => {
        if (garagem[veiculoSelecionado]) showVehicleModificationView(garagem[veiculoSelecionado]);
    });
    Cache.btnCancelarModificar?.addEventListener("click", () => { modoEdicao = false; updateUIForSelectedVehicle(); });
    Cache.btnCriarVeiculo?.addEventListener("click", handleCreateModifyVehicle);
    Cache.acoesVeiculoSection?.addEventListener("click", handleVehicleAction);
    Cache.btnTocarMusica?.addEventListener("click", handlePlayMusic);
    Cache.btnPararMusica?.addEventListener("click", handleStopMusic);
    Cache.musicaInputElement?.addEventListener("change", handleMusicFileSelect);
    Cache.formAgendarManutencao?.addEventListener('submit', handleMaintenanceSubmit);
    Cache.btnFecharDetalhesAPI?.addEventListener('click', () => {
        hideElement(Cache.secaoDetalhesExtrasAPIDiv);
        if (Cache.detalhesExtrasVeiculoContentDiv) Cache.detalhesExtrasVeiculoContentDiv.innerHTML = '<p>Clique em "Detalhes API" para carregar.</p>';
    });
}

function exibirDadosExtrasDaAPI(detalhes) {
    if (!Cache.detalhesExtrasVeiculoContentDiv) return;
    let html = "<ul>";
    for (const [chave, valor] of Object.entries(detalhes)) {
        if (chave === 'id') continue; // Não exibe o ID da API
        const chaveFmt = chave.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
        let valExibido = valor;
        if (typeof valor === 'boolean') valExibido = valor ? 'Sim' : 'Não';
        else if (valor === null || valor === undefined || valor === "") valExibido = 'Não informado';
        html += `<li><strong>${chaveFmt}:</strong> ${valExibido}</li>`;
    }
    html += "</ul>";
    Cache.detalhesExtrasVeiculoContentDiv.innerHTML = html;
    showElement(Cache.secaoDetalhesExtrasAPIDiv);
}

function handleCreateModifyVehicle() {
    if (!veiculoSelecionado) { showNotification("Selecione um tipo!", 'warning'); return; }
    const modelo = Cache.modeloInput?.value.trim();
    const cor = Cache.corInput?.value.trim();
    if (!modelo || !cor) { showNotification("Modelo e Cor são obrigatórios!", 'error'); Cache.modeloInput?.focus(); return; }
    const nickname = Cache.nicknameInput?.value.trim() || null;
    let capacidade=null, envergadura=null, tipoBike=null;
    try {
        if (veiculoSelecionado === 'caminhao') { capacidade = parseInt(Cache.capacidadeCargaInput.value); if (isNaN(capacidade) || capacidade < 0) throw new Error("Capacidade inválida."); }
        else if (veiculoSelecionado === 'aviao') { envergadura = parseFloat(Cache.envergaduraInput.value); if (isNaN(envergadura) || envergadura <= 0) throw new Error("Envergadura inválida."); }
        else if (veiculoSelecionado === 'bicicleta') { tipoBike = Cache.tipoBicicletaSelect.value; if (!tipoBike) throw new Error("Selecione o tipo da bicicleta."); }
    } catch (error) { showNotification(`Erro: ${error.message}`, 'error'); return; }

    const vExistente = garagem[veiculoSelecionado];
    const isMod = vExistente instanceof Veiculo && modoEdicao; // Assumindo que Veiculo é uma classe
    const assignVehicle = (imgURL = null) => {
        let vProc = null;
        const defFuel = (typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL : 50);
        const defFuelCap = (typeof Constants !== 'undefined' ? Constants.FUEL_CAPACITY : 100);
        const defVol = (typeof Constants !== 'undefined' ? Constants.DEFAULT_VOLUME : 0.5);
        const hist = isMod ? (vExistente.historicoManutencao ?? []) : [];
        const ligado = isMod ? (vExistente.ligado ?? false) : false;
        const vel = isMod ? (vExistente.velocidade ?? 0) : 0;
        const vol = isMod ? (vExistente.volume ?? defVol) : defVol;
        const mNome = isMod ? (vExistente.musicaNome ?? "Nenhuma") : "Nenhuma";
        const fuel = isMod ? (vExistente.fuelLevel ?? defFuel) : defFuel;
        const fCap = isMod ? (vExistente.fuelCapacity ?? defFuelCap) : defFuelCap;
        const trb = (isMod && typeof CarroEsportivo !== 'undefined' && vExistente instanceof CarroEsportivo) ? (vExistente.turboAtivado ?? false) : false;
        const car = (isMod && typeof Caminhao !== 'undefined' && vExistente instanceof Caminhao) ? (vExistente.cargaAtual ?? 0) : 0;
        const alt = (isMod && typeof Aviao !== 'undefined' && vExistente instanceof Aviao) ? (vExistente.altitude ?? 0) : 0;
        const voa = (isMod && typeof Aviao !== 'undefined' && vExistente instanceof Aviao) ? (vExistente.voando ?? false) : false;
        const id_api_atual = isMod ? vExistente.id_api : (idApiPorTipo[veiculoSelecionado] || null);
        try {
            const finalImg = imgURL || (isMod ? vExistente.imagem : null);

            // Verifica se as classes específicas estão definidas
            const CarroDef = typeof Carro !== 'undefined';
            const CarroEsportivoDef = typeof CarroEsportivo !== 'undefined';
            const CaminhaoDef = typeof Caminhao !== 'undefined';
            const AviaoDef = typeof Aviao !== 'undefined';
            const MotoDef = typeof Moto !== 'undefined';
            const BicicletaDef = typeof Bicicleta !== 'undefined';

            if (veiculoSelecionado === 'carro' && CarroDef) vProc = new Carro(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist, id_api_atual);
            else if (veiculoSelecionado === 'esportivo' && CarroEsportivoDef) vProc = new CarroEsportivo(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist, trb, id_api_atual);
            else if (veiculoSelecionado === 'caminhao' && CaminhaoDef) vProc = new Caminhao(modelo, cor, nickname, capacidade, finalImg, ligado, vel, fuel, hist, car, id_api_atual);
            else if (veiculoSelecionado === 'aviao' && AviaoDef) vProc = new Aviao(modelo, cor, nickname, envergadura, finalImg, ligado, vel, fuel, hist, alt, voa, id_api_atual);
            else if (veiculoSelecionado === 'moto' && MotoDef) vProc = new Moto(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist, id_api_atual);
            else if (veiculoSelecionado === 'bicicleta' && BicicletaDef) vProc = new Bicicleta(modelo, cor, nickname, tipoBike, finalImg, vel, hist, id_api_atual);
            else throw new Error(`Classe para '${veiculoSelecionado}' não encontrada ou tipo inválido.`);

            if (!(vProc instanceof Veiculo)) throw new Error(`Falha ao criar ${veiculoSelecionado}.`); // Assumindo Veiculo
            vProc.volume = vol; vProc.musicaNome = mNome; vProc.fuelCapacity = fCap;
            vProc.musica = (isMod && vExistente.musica) ? vExistente.musica : null; // Mantém o objeto Audio se existir
            vProc.musicaTocando = (isMod && vExistente.musicaTocando && vProc.musica === vExistente.musica); // Mantém estado de reprodução
            garagem[veiculoSelecionado] = vProc; salvarGaragem();
            showNotification(`Veículo ${isMod ? 'modificado' : 'criado'}!`, 'success');
            modoEdicao = false; updateUIForSelectedVehicle();
        } catch (error) { showNotification(`Erro: ${error.message}`, 'error'); console.error("Erro assignVehicle:", error); }
        finally { document.getElementById('image-help-text')?.remove(); }
    };
    const imgFile = Cache.imagemInput?.files?.[0];
    if (imgFile) {
        if (!imgFile.type.startsWith('image/')) { showNotification("Arquivo de imagem inválido.", 'error'); Cache.imagemInput.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (e) => assignVehicle(e.target?.result);
        reader.onerror = () => { showNotification("Erro ao ler imagem.", 'error'); assignVehicle(); }; // Tenta criar/modificar sem nova imagem
        reader.readAsDataURL(imgFile);
    } else { assignVehicle(); } // Sem nova imagem selecionada
}

async function handleVehicleAction(event) {
    const btn = event.target.closest('button[data-acao]'); if (!btn) return;
    const acao = btn.dataset.acao; const v = garagem[veiculoSelecionado];
    if (!v) { showNotification("Nenhum veículo selecionado!", 'warning'); return; }
    try {
        if (acao === 'verDetalhesAPI') {
            if (v.id_api) {
                const detalhes = await buscarDetalhesVeiculoAPI(v.id_api);
                if (detalhes) exibirDadosExtrasDaAPI(detalhes);
                else if (Cache.detalhesExtrasVeiculoContentDiv && !Cache.detalhesExtrasVeiculoContentDiv.querySelector('.api-error-message')) {
                    Cache.detalhesExtrasVeiculoContentDiv.innerHTML = `<p>Nenhum detalhe extra encontrado (ID API: ${v.id_api}).</p>`;
                    showElement(Cache.secaoDetalhesExtrasAPIDiv);
                }
            } else { showNotification("Veículo sem ID para API ou não selecionado.", "warning"); hideElement(Cache.secaoDetalhesExtrasAPIDiv); }
        } else if (typeof v[acao] === 'function') {
            if (acao === 'carregar' && typeof Caminhao !== 'undefined' && v instanceof Caminhao) {
                const maxCarga = (v.capacidadeCarga ?? 0) - (v.cargaAtual ?? 0);
                const qStr = prompt(`Quanto carregar? (Max: ${maxCarga}kg). Deixe em branco para cancelar.`, `${maxCarga > 0 ? maxCarga : ''}`);
                if (qStr === null || qStr.trim() === '') return; // Cancelado ou vazio
                v.carregar(qStr);
            } else if (acao === 'descarregar' && typeof Caminhao !== 'undefined' && v instanceof Caminhao) {
                const qStr = prompt(`Quanto descarregar? (Atual: ${v.cargaAtual ?? 0}kg). Deixe em branco para cancelar.`, `${v.cargaAtual > 0 ? v.cargaAtual : ''}`);
                if (qStr === null || qStr.trim() === '') return; // Cancelado ou vazio
                v.descarregar(qStr);
            } else if (acao === 'acelerar' || acao === 'frear') {
                v[acao](10); // Exemplo: acelera/freia em incrementos de 10
            }
            else {
                v[acao](); // Chama o método diretamente para outras ações
            }
            updateDisplayContent(v); // Atualiza UI após a ação
        } else {
            showNotification(`Ação '${acao}' não implementada para este veículo.`, "warning");
        }
    } catch (error) { showNotification(`Erro: ${error.message}`, 'error'); console.error(`Erro na ação "${acao}":`, error); }
}

function handlePlayMusic() {
    const v = garagem[veiculoSelecionado];
    if (v instanceof Veiculo && !(typeof Bicicleta !== 'undefined' && v instanceof Bicicleta)) v.tocarMusica();
    else if (typeof Bicicleta !== 'undefined' && v instanceof Bicicleta) showNotification("Bicicletas não tocam música.", 'info');
    else showNotification("Selecione um veículo motorizado.", 'warning');
}
function handleStopMusic() {
    const v = garagem[veiculoSelecionado];
    if (v instanceof Veiculo && !(typeof Bicicleta !== 'undefined' && v instanceof Bicicleta)) v.pararMusica();
}
function handleMusicFileSelect(event) {
    const input = event.target; const file = input.files?.[0]; if (!file) return;
    const v = garagem[veiculoSelecionado];
    if (!v || (typeof Bicicleta !== 'undefined' && v instanceof Bicicleta)) { showNotification("Selecione veículo motorizado.", 'warning'); input.value = ""; return; }
    if (!file.type.startsWith('audio/')) { showNotification("Arquivo não é áudio.", 'warning'); input.value = ""; return; }
    const reader = new FileReader();
    reader.onload = (e) => { try { if (!e.target?.result) throw new Error("Falha ao ler."); v.setMusica(new Audio(e.target.result), file.name); showNotification(`Música "${file.name}" carregada.`, 'success'); }
                        catch (err) { showNotification(`Erro áudio: ${err.message}`, 'error'); input.value = ""; }};
    reader.onerror = () => { showNotification("Erro ao ler arquivo de música.", 'error'); input.value = ""; };
    reader.readAsDataURL(file);
}

function handleMaintenanceSubmit(event) {
    event.preventDefault(); const v = garagem[veiculoSelecionado];
    if (!v) { showNotification("Selecione um veículo.", 'warning'); return; }
    const data = Cache.manutencaoDataInput?.value;
    const tipo = Cache.manutencaoTipoInput?.value.trim();
    const custo = Cache.manutencaoCustoInput?.value;
    const desc = Cache.manutencaoDescricaoTextarea?.value.trim();
    if (!data || !tipo || custo === '' || custo === null) { showNotification("Data, Tipo e Custo são obrigatórios.", 'error'); return; }
    try { 
        if (typeof Manutencao === 'undefined') throw new Error("Classe Manutencao não está definida.");
        v.adicionarManutencao(new Manutencao(data, tipo, custo, desc)); // Assumindo classe Manutencao
        if (Cache.manutencaoTipoInput) Cache.manutencaoTipoInput.value = ''; // Limpa campos
        if (Cache.manutencaoCustoInput) Cache.manutencaoCustoInput.value = '';
        if (Cache.manutencaoDescricaoTextarea) Cache.manutencaoDescricaoTextarea.value = '';
        flatpickrInstance?.clear(); // Limpa o datepicker
        updateManutencaoUI(v);
    } catch (error) { showNotification(`Erro manutenção: ${error.message}`, 'error'); console.error("Erro submit manut:", error); }
}

// As linhas comentadas abaixo foram removidas pois eram redeclarações
// e estavam causando problemas. As definições corretas estão no topo do arquivo.
//
// // --- Cache de Elementos DOM --- (já definido acima, não precisa repetir)
// // const Cache = {};

// // --- Variáveis Globais de Estado --- (já definido acima, não precisa repetir)
// // let garagem = {};
// // let veiculoSelecionado = null;
// // let modoEdicao = false;
// // let flatpickrInstance = null;
// // let isInitialized = false; // já definido acima

// A função DOMContentLoaded já está definida e correta acima.