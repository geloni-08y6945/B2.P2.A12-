// server.js (Versão com conexão ao MongoDB)

// ==================================================================
//                            IMPORTAÇÕES
// ==================================================================
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose'; // Importação do Mongoose

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================================================================
//                  CONFIGURAÇÃO DO APP E VARIÁVEIS
// ==================================================================
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;
const mongoUri = process.env.MONGO_URI;

// ==================================================================
//                   CONEXÃO COM O MONGODB
// ==================================================================

// Função assíncrona para conectar ao banco de dados
const connectToDB = async () => {
    if (!mongoUri) {
        console.error('❌ ERRO: A variável de ambiente MONGO_URI não foi definida.');
        process.exit(1); // Encerra o processo se a URI não existir
    }
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Conexão com o MongoDB estabelecida com sucesso!');
    } catch (error) {
        console.error('❌ Não foi possível conectar ao MongoDB:', error.message);
        process.exit(1); // Encerra o processo em caso de falha na conexão
    }
};

// ==================================================================
//              DEFINIÇÃO DOS MODELOS (SCHEMAS) DO MONGOOSE
// ==================================================================

// Schema para as dicas de manutenção
const DicaSchema = new mongoose.Schema({
    dica: { type: String, required: true },
    // 'geral', 'carro', 'moto', etc.
    tipo: { type: String, required: true, default: 'geral' } 
});
const Dica = mongoose.model('Dica', DicaSchema);

// Schema para os veículos em destaque
const VeiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: true },
    ano: { type: Number, required: true },
    destaque: { type: String, required: true },
    imagemUrl: { type: String, required: true }
});
const Veiculo = mongoose.model('Veiculo', VeiculoSchema);


// ==================================================================
//                            MIDDLEWARE
// ==================================================================

// Permite que o frontend (rodando em outra porta/domínio) acesse a API
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));


// ==================================================================
//                         ENDPOINTS DA API
// ==================================================================

// ENDPOINT 1: Previsão do Tempo (Sem alterações)
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const apiResponse = await axios.get(weatherAPIUrl);
        res.json(apiResponse.data);
    } catch (error) {
        console.error("[Servidor] Erro ao buscar previsão:", error.response?.data || error.message);
        const status = error.response?.status || 500;
        res.status(status).json({ error: 'Erro ao buscar previsão do tempo.' });
    }
});

// ENDPOINT 2: Dicas de manutenção gerais (Agora busca do DB)
app.get('/api/dicas-manutencao', async (req, res) => {
    console.log("Recebida requisição para /api/dicas-manutencao");
    try {
        const dicasGerais = await Dica.find({ tipo: 'geral' });
        res.json(dicasGerais);
    } catch (error) {
        console.error("Erro ao buscar dicas gerais:", error);
        res.status(500).json({ error: "Erro interno ao buscar dicas no banco de dados." });
    }
});

// ENDPOINT 3: Dicas específicas por tipo de veículo (Agora busca do DB)
app.get('/api/dicas-manutencao/:tipoVeiculo', async (req, res) => {
    const { tipoVeiculo } = req.params;
    console.log(`Recebida requisição para dicas do tipo: ${tipoVeiculo}`);
    try {
        const dicas = await Dica.find({ tipo: tipoVeiculo.toLowerCase() });
        if (dicas.length > 0) {
            res.json(dicas);
        } else {
            res.status(404).json({ error: `Nenhuma dica encontrada para o tipo: ${tipoVeiculo}` });
        }
    } catch (error) {
        console.error(`Erro ao buscar dicas para ${tipoVeiculo}:`, error);
        res.status(500).json({ error: "Erro interno ao buscar dicas no banco de dados." });
    }
});

// ENDPOINT 4: Lista de veículos em destaque (Agora busca do DB)
app.get('/api/garagem/veiculos-destaque', async (req, res) => {
    console.log("Recebida requisição para /api/garagem/veiculos-destaque");
    try {
        const veiculos = await Veiculo.find({});
        res.json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos em destaque:", error);
        res.status(500).json({ error: "Erro interno ao buscar veículos no banco de dados." });
    }
});

// ==================================================================
//              INICIA O SERVIDOR APÓS CONECTAR AO DB
// ==================================================================

const startServer = async () => {
    await connectToDB(); // Primeiro, conecta ao banco de dados
    app.listen(port, () => { // Depois, inicia o servidor Express
        console.log(`🚀 Servidor backend rodando na porta ${port}`);
    });
};

startServer();