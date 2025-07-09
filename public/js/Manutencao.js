// ======================================================
// Arquivo: js/Manutencao.js
// ======================================================

class Manutencao {
    data;
    tipo;
    custo;
    descricao;

    constructor(dataInput, tipo, custo, descricao = '') {
        if (!this._validarData(dataInput)) throw new Error("Data inválida para manutenção.");
        if (typeof tipo !== 'string' || !tipo.trim()) throw new Error("Tipo de serviço inválido.");
        const custoNum = parseFloat(custo);
        if (isNaN(custoNum) || custoNum < 0) throw new Error("Custo de manutenção inválido.");

        const dateObj = new Date(dataInput);
        if (isNaN(dateObj.getTime())) throw new Error("Formato de data inválido.");
        dateObj.setUTCHours(0, 0, 0, 0);
        this.data = dateObj.toISOString();
        this.tipo = tipo.trim();
        this.custo = custoNum;
        this.descricao = descricao.trim();
    }

    _validarData(dataInput) {
        if (!dataInput || (typeof dataInput === 'string' && !dataInput.trim())) return false;
        return !isNaN(new Date(dataInput).getTime());
    }

    getDataObj() { return new Date(this.data); }

    isAgendamento() {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        return this.getDataObj() >= hoje;
    }

    isHistorico() {
        return !this.isAgendamento();
    }

    formatar() {
        const dataFormatada = this.getDataObj().toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const descSanitized = this.descricao.replace(/</g, "<").replace(/>/g, ">");
        let html = `<span class="tipo-servico">${this.tipo}</span> em <span class="data-servico">${dataFormatada}</span> <span class="custo-servico">${custoFormatado}</span>`;
        if (this.isAgendamento()) {
            html += ` <span class="status-agendado">(Agendado)</span>`;
        }
        if (this.descricao) {
            html += `<span class="descricao-servico">Detalhes: ${descSanitized}</span>`;
        }
        return `<p>${html}</p>`;
    }

    toPlainObject() {
        return { data: this.data, tipo: this.tipo, custo: this.custo, descricao: this.descricao };
    }

    static fromPlainObject(obj) {
        if (!obj?.data || !obj?.tipo || obj.custo === undefined) {
            console.error("Dados de Manutenção inválidos para fromPlainObject:", obj);
            return null;
        }
        try {
            return new Manutencao(obj.data, obj.tipo, obj.custo, obj.descricao || '');
        }
        catch (e) {
            console.error("Erro ao recriar Manutencao:", obj, e);
            return null;
        }
    }
}