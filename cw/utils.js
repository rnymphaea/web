// Константы для тайлов карты
export const emptyCell = 0; // ID пустого тайла (воздух)

// ТОЛЬКО тайлы с ID 1-22 являются препятствиями
// Все остальные (включая 367-481) - фон
export function isSolidTile(tileId) {
    return tileId >= 1 && tileId <= 30;
}

// Стартовая позиция игрока
export const PLAYER_START_X = 0; // 2 тайла от левого края
export const PLAYER_START_Y = 1024; // Сверху

// Список уровней
export const maps = ["lvl1.json"];
