// ======================================================
// Arquivo: js/Moto.js
// ======================================================
class Moto extends Veiculo {
    // tipoGuidao; // Exemplo de propriedade específica

    constructor(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, /* tipoGuidao = 'standard', */ id_api_param = null) {
        super(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoManutencao, id_api_param);
        // this.tipoGuidao = tipoGuidao;
    }

    // Os métodos ligar, desligar, acelerar, frear são herdados de Veiculo.
    // O método ativarTurbo é herdado de Veiculo e informará "não aplicável".

    exibirInformacoes() {
        // return `[Moto] ${super.exibirInformacoesBase()}, Guidão: ${this.tipoGuidao} <i class="fas fa-motorcycle" title="Moto"></i>`;
        return `[Moto] ${super.exibirInformacoesBase()} <i class="fas fa-motorcycle" title="Moto"></i>`;
    }
}