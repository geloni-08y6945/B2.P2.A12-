// ======================================================
// Arquivo: js/Veiculo.js
// ======================================================

class Veiculo {
    modelo; cor; nickname; imagem; ligado; velocidade; volume;
    musica; musicaTocando; musicaNome;
    fuelCapacity; fuelLevel; historicoManutencao;
    id_api;

    constructor(
        modelo, cor, nickname = null, imagem = null, ligado = false, velocidade = 0,
        fuelLevel = (typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL : 100),
        historicoManutencao = [],
        id_api_param = null
    ) {
        if (!modelo?.trim()) throw new Error("Modelo do veículo é obrigatório.");
        if (!cor?.trim()) throw new Error("Cor do veículo é obrigatória.");

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.nickname = nickname ? nickname.trim() : null;
        this.imagem = imagem;
        this.ligado = Boolean(ligado);
        this.velocidade = Math.max(0, Number(velocidade) || 0);
        this.volume = (typeof Constants !== 'undefined' ? Constants.DEFAULT_VOLUME : 0.5);
        this.musica = null;
        this.musicaTocando = false;
        this.musicaNome = "Nenhuma música selecionada";
        this.fuelCapacity = (typeof Constants !== 'undefined' ? Constants.FUEL_CAPACITY : 100);
        this.fuelLevel = Math.max(0, Math.min(Number(fuelLevel) || this.fuelCapacity, this.fuelCapacity));

        this.historicoManutencao = Array.isArray(historicoManutencao)
            ? historicoManutencao.map(item => {
                if (item instanceof Manutencao) return item;
                if (typeof Manutencao !== 'undefined' && typeof Manutencao.fromPlainObject === 'function') {
                    return Manutencao.fromPlainObject(item);
                }
                return null;
            }).filter(Boolean).sort((a, b) => b.getDataObj() - a.getDataObj())
            : [];
        this.id_api = id_api_param;
    }

    getIdentifier() { return this.nickname || this.modelo; }

    _callGlobal(funcName, ...args) {
        if (typeof window[funcName] === 'function') {
            return window[funcName](...args);
        }
        // console.warn(`Função global ${funcName} não encontrada.`);
    }

    consumirCombustivel(quantidade) {
        // Verifica se a classe Bicicleta está definida antes de usar instanceof
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) return true;

        if (this.fuelLevel <= 0) return false;
        const consumo = Math.max(0, quantidade);
        if (this.fuelLevel < consumo) {
            this.fuelLevel = 0;
            if (this.ligado) {
                this.desligar();
                this._callGlobal('showNotification', `${this.getIdentifier()} desligado por falta de combustível!`, 'error');
            } else { this.updateDisplay(); }
            return false;
        }
        this.fuelLevel -= consumo;
        this.updateDisplay();
        return true;
    }

    reabastecer() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) { this._callGlobal('showNotification', "Bicicletas não usam combustível!", 'info'); return; }

        if (this.fuelLevel >= this.fuelCapacity) { this._callGlobal('showNotification', `${this.getIdentifier()} já está com tanque cheio.`, 'info'); return; }
        this.fuelLevel = this.fuelCapacity;
        this._callGlobal('showNotification', `${this.getIdentifier()} reabastecido!`, 'success');
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    ligar() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) { this._callGlobal('showNotification', "Bicicletas não ligam!", 'info'); return; }

        if (this.ligado) { /*this._callGlobal('showNotification', `${this.getIdentifier()} já está ligado.`, 'info');*/ return; }
        if (this.fuelLevel <= 0) { this._callGlobal('showNotification', `${this.getIdentifier()} sem combustível!`, 'warning'); return; }
        const startupCost = (typeof Constants !== 'undefined' ? Constants.STARTUP_FUEL_COST : 1);
        if (!this.consumirCombustivel(startupCost)) {
            this._callGlobal('showNotification', `${this.getIdentifier()} não ligou (combustível insuficiente).`, 'error');
            return;
        }
        this._callGlobal('playSound', "ligar", this.volume);
        this.ligado = true;
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    desligar() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) { this._callGlobal('showNotification', "Bicicletas não desligam!", 'info'); return; }

        const isAviaoClassDefined = typeof Aviao !== 'undefined';
        if (isAviaoClassDefined && this instanceof Aviao && this.voando) { this._callGlobal('showNotification', "Pouse o avião antes de desligar!", 'warning'); return; }

        if (!this.ligado) { /*this._callGlobal('showNotification', `${this.getIdentifier()} já está desligado.`, 'info');*/ return; }

        this._callGlobal('playSound', "desligar", this.volume);
        this.pararMusica();
        this.ligado = false;
        this.velocidade = 0;
        const isCarroEsportivoClassDefined = typeof CarroEsportivo !== 'undefined';
        if (isCarroEsportivoClassDefined && this instanceof CarroEsportivo) {
            this.turboAtivado = false;
        }
        this.updateDisplay();
        this._callGlobal('salvarGaragem');
    }

    acelerar(incremento = 10) {
        const inc = Math.abs(Number(incremento)) || 10;
        const accelCostBase = (typeof Constants !== 'undefined' ? Constants.ACCEL_FUEL_COST : 0.5);

        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) {
            const velMaxBike = 40;
            this.velocidade = Math.min(velMaxBike, this.velocidade + inc / 2);
            this.updateDisplay(); this._callGlobal('salvarGaragem'); return;
        }

        if (!this.ligado) { this._callGlobal('showNotification', "Ligue o veículo para acelerar.", 'warning'); return; }

        let fuelCost = accelCostBase;
        let velMax = 150;

        const isCarroEsportivoClassDefined = typeof CarroEsportivo !== 'undefined';
        const isCaminhaoClassDefined = typeof Caminhao !== 'undefined';
        const isAviaoClassDefined = typeof Aviao !== 'undefined';
        const isMotoClassDefined = typeof Moto !== 'undefined';

        if (isCarroEsportivoClassDefined && this instanceof CarroEsportivo) {
            velMax = this.turboAtivado ? 300 : 200;
            if (this.turboAtivado) fuelCost *= (typeof Constants !== 'undefined' ? Constants.TURBO_FUEL_COST_MULTIPLIER : 2.5);
        } else if (isCaminhaoClassDefined && this instanceof Caminhao) {
            velMax = 120; fuelCost *= (typeof Constants !== 'undefined' ? Constants.TRUCK_FUEL_COST_MULTIPLIER : 1.8);
        } else if (isAviaoClassDefined && this instanceof Aviao) {
            velMax = this.voando ? 900 : 100;
            if (this.voando) fuelCost *= (typeof Constants !== 'undefined' ? Constants.FLYING_FUEL_COST_MULTIPLIER : 3.0);
            if (!this.voando && this.velocidade >= velMax) { this._callGlobal('showNotification', `Vel. máx. em solo (${velMax} km/h) atingida.`, 'info'); this.velocidade = velMax; this.updateDisplay(); return; }
        } else if (isMotoClassDefined && this instanceof Moto) {
            velMax = 180;
        }

        if (!this.consumirCombustivel(fuelCost)) { this._callGlobal('showNotification', `${this.getIdentifier()} sem combustível para acelerar!`, 'warning'); return; }
        if (this.velocidade >= velMax) { this.velocidade = Math.min(this.velocidade, velMax); this.updateDisplay(); return; }

        this._callGlobal('playSound', "acelerar", this.volume);
        this.velocidade = Math.min(velMax, this.velocidade + inc);
        this.updateDisplay(); this._callGlobal('salvarGaragem');
    }

    frear(decremento = 10) {
        const dec = Math.abs(Number(decremento)) || 10;
        if (this.velocidade === 0) return;

        const isAviaoClassDefined = typeof Aviao !== 'undefined';
        if (isAviaoClassDefined && this instanceof Aviao && this.voando) {
            this._callGlobal('showNotification', "Use controles de voo para reduzir velocidade aérea.", 'warning'); return;
        }

        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (!(isBicicletaClassDefined && this instanceof Bicicleta)) {
            this._callGlobal('playSound', "frear", this.volume);
        }

        this.velocidade = Math.max(0, this.velocidade - dec);
        this.updateDisplay(); this._callGlobal('salvarGaragem');
    }

    ativarTurbo() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) {
            this._callGlobal('showNotification', "Bicicletas não possuem turbo!", 'info');
            return;
        }
        if (!this.ligado) {
            this._callGlobal('showNotification', "Ligue o veículo primeiro.", "warning");
            return;
        }
        this._callGlobal('showNotification', `Turbo não disponível para ${this.constructor.name}.`, 'info');
    }

    buzinar() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        this._callGlobal('playSound', (isBicicletaClassDefined && this instanceof Bicicleta ? "buzina_bike" : "buzina"), this.volume);
    }

    setMusica(audioElement, nomeArquivo) {
        this.pararMusica();
        this.musica = audioElement;
        this.musicaNome = nomeArquivo || "Música carregada";
        if (this.musica instanceof Audio) { this.musica.loop = true; this.musica.volume = this.volume; }
        this.updateDisplay(); this._callGlobal('salvarGaragem');
    }

    tocarMusica() {
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';
        if (isBicicletaClassDefined && this instanceof Bicicleta) { this._callGlobal('showNotification', "Bicicletas não têm som.", 'info'); return; }

        if (this.musicaTocando || !(this.musica instanceof Audio)) {
            if (!(this.musica instanceof Audio)) this._callGlobal('showNotification', "Nenhuma música carregada.", 'warning');
            return;
        }
        this.musica.volume = this.volume;
        this.musica.play().then(() => { this.musicaTocando = true; this.updateDisplay(); }).catch(e => {
            this.musicaTocando = false; this.updateDisplay();
            this._callGlobal('showNotification', e.name === 'NotAllowedError' ? "Interação do usuário para tocar áudio." : `Erro ao tocar: ${e.message}.`, 'warning');
            console.error("Erro ao tocar música:", e);
        });
    }

    pararMusica() {
        if (!this.musicaTocando || !(this.musica instanceof Audio)) return;
        this.musica.pause(); this.musica.currentTime = 0; this.musicaTocando = false;
        this.updateDisplay();
    }

    adicionarManutencao(manutencaoObj) {
        if (!(manutencaoObj instanceof Manutencao)) throw new Error("Objeto de manutenção inválido.");
        this.historicoManutencao.push(manutencaoObj);
        this.historicoManutencao.sort((a, b) => b.getDataObj() - a.getDataObj());
        this._callGlobal('salvarGaragem');
        this._callGlobal('updateManutencaoUI', this);
        this._callGlobal('showNotification', "Manutenção registrada!", 'success');
    }

    getHistoricoFormatado() {
        const historico = this.historicoManutencao.filter(m => m.isHistorico()).map(m => m.formatar());
        return historico.length > 0 ? historico.join('') : "<p>Nenhum histórico registrado.</p>";
    }

    getAgendamentosFormatados() {
        const agendamentos = this.historicoManutencao.filter(m => m.isAgendamento()).sort((a, b) => a.getDataObj() - b.getDataObj()).map(m => m.formatar());
        return agendamentos.length > 0 ? agendamentos.join('') : "<p>Nenhum agendamento futuro.</p>";
    }

    exibirInformacoesBase() {
        const nick = this.nickname ? `"${this.nickname}" ` : '';
        const modeloSeguro = String(this.modelo).replace(/</g, "<").replace(/>/g, ">");
        const corSegura = String(this.cor).replace(/</g, "<").replace(/>/g, ">");
        const nickSeguro = nick.replace(/</g, "<").replace(/>/g, ">");
        return `${nickSeguro}Modelo: ${modeloSeguro}, Cor: ${corSegura}`;
    }

    exibirInformacoes() { return this.exibirInformacoesBase(); }

    updateDisplay() { this._callGlobal('updateDisplayContent', this); }

    toPlainObject() {
        let plainData = {
            tipoVeiculo: this.constructor.name,
            modelo: this.modelo, cor: this.cor, nickname: this.nickname, imagem: this.imagem,
            ligado: this.ligado, velocidade: this.velocidade, fuelLevel: this.fuelLevel,
            fuelCapacity: this.fuelCapacity, musicaNome: this.musicaNome, volume: this.volume,
            historicoManutencao: this.historicoManutencao.map(m => m.toPlainObject()),
            id_api: this.id_api,
        };

        const isCarroEsportivoClassDefined = typeof CarroEsportivo !== 'undefined';
        const isCaminhaoClassDefined = typeof Caminhao !== 'undefined';
        const isAviaoClassDefined = typeof Aviao !== 'undefined';
        const isMotoClassDefined = typeof Moto !== 'undefined';
        const isBicicletaClassDefined = typeof Bicicleta !== 'undefined';

        if (isCarroEsportivoClassDefined && this instanceof CarroEsportivo) plainData.turboAtivado = this.turboAtivado;
        if (isCaminhaoClassDefined && this instanceof Caminhao) { plainData.capacidadeCarga = this.capacidadeCarga; plainData.cargaAtual = this.cargaAtual; }
        if (isAviaoClassDefined && this instanceof Aviao) { plainData.envergadura = this.envergadura; plainData.altitude = this.altitude; plainData.voando = this.voando; }
        if (isMotoClassDefined && this instanceof Moto) { /* Ex: plainData.tipoGuidao = this.tipoGuidao; */ }
        if (isBicicletaClassDefined && this instanceof Bicicleta) {
            plainData.tipo = this.tipo;
            delete plainData.ligado; delete plainData.fuelLevel; delete plainData.fuelCapacity;
            delete plainData.musicaNome; delete plainData.volume;
        }
        return plainData;
    }
}