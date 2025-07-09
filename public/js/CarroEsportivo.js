// ======================================================
// Arquivo: js/CarroEsportivo.js
// ======================================================
class CarroEsportivo extends Veiculo {
    turboAtivado;

    constructor(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, turboAtivado = false, id_api_param = null) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param);
        this.turboAtivado = Boolean(turboAtivado);
    }

    // Os métodos ligar, desligar, acelerar, frear são herdados de Veiculo.

    // Sobrescreve o método ativarTurbo da classe Veiculo
    ativarTurbo() {
        if (!this.ligado) { this._callGlobal('showNotification', "Ligue o carro antes de ativar o turbo.", "warning"); return; }
        if (this.turboAtivado) { this._callGlobal('showNotification', "Turbo já está ativo!", "info"); return; }

        const turboActivationCost = (typeof Constants !== 'undefined' ? Constants.TURBO_ACTIVATION_FUEL_COST : 5);
        if (!this.consumirCombustivel(turboActivationCost)) {
            this._callGlobal('showNotification', "Sem combustível suficiente para ativar o turbo!", "warning");
            return;
        }

        this._callGlobal('playSound', "turbo", this.volume);
        this.turboAtivado = true;
        this._callGlobal('showNotification', "Turbo ATIVADO!", 'success');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    // O método desligar da classe Veiculo já cuida de this.turboAtivado = false;

    exibirInformacoes() {
        const turboStatus = this.turboAtivado ? 'Ligado <i class="fas fa-fire-alt" style="color: orange;" title="Turbo Ativo"></i>' : 'Desligado';
        return `[Esportivo] ${super.exibirInformacoesBase()}, Turbo: ${turboStatus} <i class="fas fa-bolt" title="Carro Esportivo"></i>`;
    }
}