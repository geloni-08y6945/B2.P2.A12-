// client.js (Versão Corrigida e Completa)

// Supondo que você tenha esta linha no topo do seu arquivo:
// const backendUrl = 'http://localhost:3001'; // Para teste local
// const backendUrl = 'https://seu-backend.onrender.com'; // Para produção

// ----------------- CÓDIGO PARA DICAS DE MANUTENÇÃO (Seu código, sem alterações) -----------------
const btnBuscarDicas = document.getElementById('btn-buscar-dicas');
const dicasContainer = document.getElementById('dicas-container');

async function buscarDicasDeManutencao() {
    dicasContainer.innerHTML = '<p>Carregando dicas...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao`);
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }
        const dicas = await response.json();
        exibirDicasNaTela(dicas);
    } catch (error) {
        console.error('Erro ao buscar dicas de manutenção:', error);
        dicasContainer.innerHTML = '<p>Falha ao carregar as dicas. Tente novamente.</p>';
    }
}

function exibirDicasNaTela(listaDeDicas) {
    dicasContainer.innerHTML = '';
    if (listaDeDicas.length === 0) {
        dicasContainer.innerHTML = '<p>Nenhuma dica encontrada.</p>';
        return;
    }
    const ul = document.createElement('ul');
    listaDeDicas.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.dica;
        ul.appendChild(li);
    });
    dicasContainer.appendChild(ul);
}

btnBuscarDicas.addEventListener('click', buscarDicasDeManutencao);


// ----------------- NOVO CÓDIGO PARA VEÍCULOS EM DESTAQUE -----------------
async function carregarVeiculosDestaque() {
    const container = document.getElementById('veiculos-destaque-container');
    if (!container) {
        console.error('Elemento #veiculos-destaque-container não encontrado no HTML.');
        return;
    }

    container.innerHTML = '<p>Carregando veículos...</p>';
    
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`);
        if (!response.ok) {
            throw new Error('Falha ao buscar os veículos em destaque.');
        }
        const veiculos = await response.json();

        container.innerHTML = ''; 
        
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.innerHTML = `
                <img src="${veiculo.imagemUrl}" alt="Foto do ${veiculo.modelo}" style="width:100%; max-width:250px; border-radius:8px; object-fit: cover;">
                <h3>${veiculo.modelo} (${veiculo.ano})</h3>
                <p>${veiculo.destaque}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

// ----------------- INICIALIZAÇÃO DA PÁGINA -----------------
// Este bloco será executado assim que a página terminar de carregar.
window.addEventListener('load', () => {
    console.log("Página carregada. Buscando dados iniciais...");
    
    // Chama a função para carregar os veículos automaticamente.
    carregarVeiculosDestaque();
    
    // Se você tiver outras funções que devam rodar no início (como a do clima),
    // chame-as aqui também.
});