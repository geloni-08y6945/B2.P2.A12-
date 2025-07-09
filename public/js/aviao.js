// ======================================================
// Arquivo: js/Aviao.js
// ======================================================
class Aviao extends Veiculo {
    envergadura;
    altitude;
    voando;

    constructor(modelo, cor, nickname, envergadura, imagem, ligado, velocidade, fuelLevel, historicoManutencao, altitude = 0, voando = false, id_api_param = null) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param);
        const envergaduraNum = parseFloat(envergadura);
        if (isNaN(envergaduraNum) || envergaduraNum <= 0) throw new Error("Envergadura inválida para Avião.");
        this.envergadura = envergaduraNum;
        this.altitude = Math.max(0, parseInt(altitude) || 0);
        this.voando = Boolean(voando);
    }

    // Os métodos ligar, desligar (com verificação de voo), acelerar, frear (com verificação de voo),
    // e ativarTurbo são herdados de Veiculo.
    // ativarTurbo informará "não aplicável".

    decolar() {
        if (!this.ligado) { this._callGlobal('showNotification', "Ligue o avião primeiro!", "warning"); return; }
        if (this.voando) { this._callGlobal('showNotification', "Avião já está voando.", "info"); return; }
        if (this.velocidade < 80) { this._callGlobal('showNotification', "Acelere mais para decolar (mín. 80 km/h)!", "warning"); return; }

        const takeoffFuelCost = (typeof Constants !== 'undefined' ? Constants.TAKEOFF_FUEL_COST : 10) || 10; // Use constante se definida
        if (!this.consumirCombustivel(takeoffFuelCost)) {
            this._callGlobal('showNotification', "Combustível insuficiente para decolar!", "error");
            return;
        }

        this._callGlobal('playSound', "decolar", this.volume);
        this.voando = true;
        this.altitude = 1000; // Altitude inicial de cruzeiro
        this._callGlobal('showNotification', `${this.getIdentifier()} decolou! Altitude: ${this.altitude}m.`, 'success');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    aterrissar() {
        if (!this.voando) { this._callGlobal('showNotification', "Avião não está voando.", "info"); return; }
        if (this.velocidade > 120) { // Exemplo de velocidade máxima para pouso
            this._callGlobal('showNotification', "Reduza a velocidade antes de pousar (máx. 120 km/h)!", "warning");
            return;
        }
        // Adicionar custo de combustível para pouso se desejado
        // if (!this.consumirCombustivel(Constants.LANDING_FUEL_COST)) { /* ... */ }

        this._callGlobal('playSound', "aterrissar", this.volume);
        this.voando = false;
        this.altitude = 0;
        // A velocidade não é zerada imediatamente, permitindo desaceleração em solo.
        this._callGlobal('showNotification', `${this.getIdentifier()} pousou com segurança.`, 'success');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    exibirInformacoes() {
        const statusVoo = this.voando ? `Voando a ${this.altitude}m` : 'Em solo';
        return `[Avião] ${super.exibirInformacoesBase()}, Envergadura: ${this.envergadura}m, Status: ${statusVoo} <i class="fas fa-plane" title="Avião"></i>`;
    }
}