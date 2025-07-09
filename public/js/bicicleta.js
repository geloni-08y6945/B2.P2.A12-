// ======================================================
// Arquivo: js/Bicicleta.js
// ======================================================
class Bicicleta extends Veiculo {
    tipo;

    constructor(modelo, cor, nickname, tipo = 'urbana', imagem, velocidade, historicoManutencao, id_api_param = null) {
        // Passa valores padrão para 'ligado' e 'fuelLevel' que serão ignorados ou sobrescritos
        super(modelo, cor, nickname, imagem, false, velocidade, 0, historicoManutencao, id_api_param);
        this.tipo = tipo;

        // Remove/sobrescreve propriedades de Veiculo não aplicáveis a bicicleta
        delete this.ligado; // Bicicleta não tem estado 'ligado' da mesma forma
        delete this.fuelLevel;
        delete this.fuelCapacity;
        delete this.musica;
        delete this.musicaNome;
        delete this.musicaTocando;
        delete this.volume; // Volume de motor/música não se aplica
    }

    // Métodos ligar, desligar, reabastecer, tocarMusica já são tratados na classe Veiculo base
    // para dar feedback de que não se aplicam ou são ignorados para Bicicleta.
    // Acelerar e frear já têm lógica específica em Veiculo.js para Bicicleta.
    // O método ativarTurbo herdado de Veiculo.js informará "não aplicável".

    exibirInformacoes() {
        return `[Bicicleta] ${super.exibirInformacoesBase()}, Tipo: ${this.tipo.charAt(0).toUpperCase() + this.tipo.slice(1)} <i class="fas fa-bicycle" title="Bicicleta"></i>`;
    }

    // Sobrescreve toPlainObject para remover campos irrelevantes para Bicicleta
    toPlainObject() {
        const plain = super.toPlainObject(); // Pega o objeto da classe pai
        plain.tipo = this.tipo; // Adiciona a propriedade específica de Bicicleta

        // Remove propriedades que não se aplicam à bicicleta
        delete plain.ligado;
        delete plain.fuelLevel;
        delete plain.fuelCapacity;
        delete plain.musicaNome;
        delete plain.volume;
        return plain;
    }
}