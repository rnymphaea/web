// utils.js
export const emptyCell = 0;
export const ENEMY_DETECTION_RADIUS = 300;
export const ATTACK_COOLDOWN = 500; // мс
export const ENEMY_ATTACK_COOLDOWN = 1000; // мс

export function isSolidTile(tileId) {
    return tileId >= 1 && tileId <= 30;
}

export const PLAYER_START_X = 0;
export const PLAYER_START_Y = 1024;

// Типы врагов (просто спрайты)
export const ENEMY_TYPES = ["enemy_1", "enemy_2", "enemy_3"];

// Позиции врагов
export const enemiesPositionsLevel1 = [
    {x: 500, y: 1024, type: 0}, // enemy_1
    {x: 800, y: 1024, type: 1}, // enemy_2
    {x: 1200, y: 1024, type: 2}, // enemy_3
    {x: 2000, y: 1024, type: 0},
    {x: 2500, y: 1024, type: 1}
];

export const maps = ["lvl1.json"];
