// ======================================================
// @file constants.js
// @description Constantes globais da aplicação Garagem Inteligente.
// ======================================================

const Constants = {
    STORAGE_KEY: 'garagemInteligenteAPIData_v1', // Mudei para evitar conflito com dados antigos
    NOTIFICATION_DURATION: 3500,
    MAX_VISUAL_SPEED: 220,
    DEFAULT_FUEL: 100,
    FUEL_CAPACITY: 100, // Nome usado no Veiculo.js
    DEFAULT_VOLUME: 0.5,
    STARTUP_FUEL_COST: 1, // Custo para ligar
    ACCEL_FUEL_COST: 0.5, // Custo base para acelerar
    TURBO_ACTIVATION_FUEL_COST: 5, // Custo para ATIVAR o turbo
    TURBO_FUEL_COST_MULTIPLIER: 2.5, // Multiplicador de consumo com turbo ATIVO
    TRUCK_FUEL_COST_MULTIPLIER: 1.8,
    FLYING_FUEL_COST_MULTIPLIER: 3.0,
};

Object.freeze(Constants);

// console.log("Constants.js carregado:", Constants);