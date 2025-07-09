// ======================================================
// Arquivo: js/Caminhao.js
// ======================================================
class Caminhao extends Veiculo {
    capacidadeCarga;
    cargaAtual;

    constructor(modelo, cor, nickname, capacidadeCarga, imagem, ligado, velocidade, fuelLevel, historicoManutencao, cargaAtual = 0, id_api_param = null) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param);
        const capNum = parseInt(capacidadeCarga);
        // Permite capacidade 0, mas não negativa.
        if (isNaN(capNum) || capNum < 0) throw new Error("Capacidade de carga inválida para Caminhão (deve ser um número >= 0).");
        this.capacidadeCarga = capNum;
        this.cargaAtual = Math.max(0, Math.min(parseInt(cargaAtual) || 0, this.capacidadeCarga));
    }

    // Os métodos ligar, desligar, acelerar, frear são herdados de Veiculo.
    // O método ativarTurbo é herdado de Veiculo e informará "não aplicável".

    carregar(quantidade) {
        const quantNum = parseInt(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) { this._callGlobal('showNotification', "Quantidade para carregar inválida.", "warning"); return; }
        const espacoDisponivel = this.capacidadeCarga - this.cargaAtual;
        if (quantNum > espacoDisponivel) { this._callGlobal('showNotification', `Não cabe! Espaço livre: ${espacoDisponivel}kg. Tentou carregar: ${quantNum}kg.`, "warning"); return; }
        this.cargaAtual += quantNum;
        this._callGlobal('showNotification', `${quantNum}kg carregados. Carga atual: ${this.cargaAtual}/${this.capacidadeCarga}kg.`, 'info');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    descarregar(quantidade) {
        const quantNum = parseInt(quantidade);
        if (isNaN(quantNum) || quantNum <= 0) { this._callGlobal('showNotification', "Quantidade para descarregar inválida.", "warning"); return; }
        if (quantNum > this.cargaAtual) { this._callGlobal('showNotification', `Não há ${quantNum}kg para descarregar. Carga atual: ${this.cargaAtual}kg.`, "warning"); return; }
        this.cargaAtual -= quantNum;
        this._callGlobal('showNotification', `${quantNum}kg descarregados. Carga restante: ${this.cargaAtual}/${this.capacidadeCarga}kg.`, 'info');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    exibirInformacoes() {
        return `[Caminhão] ${super.exibirInformacoesBase()}, Carga: ${this.cargaAtual}kg / ${this.capacidadeCarga}kg <i class="fas fa-truck-loading" title="Caminhão"></i>`;
    }
}