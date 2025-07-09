// ======================================================
// Arquivo: js/Carro.js
// ======================================================
class Carro extends Veiculo {
    constructor(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param = null) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param);
    }

    // Os métodos ligar, desligar, acelerar, frear são herdados de Veiculo.
    // O método ativarTurbo é herdado de Veiculo e informará "não aplicável".

    exibirInformacoes() {
        return `[Carro] ${super.exibirInformacoesBase()} <i class="fas fa-car-side" title="Carro"></i>`;
    }
}