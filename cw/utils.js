export const emptyCell = 0;
export const ENEMY_DETECTION_RADIUS = 300;
export const ATTACK_COOLDOWN = 500;
export const ENEMY_ATTACK_COOLDOWN = 1000;

export const DASH_DISTANCE = 200; // Дистанция рывка в пикселях
export const DASH_SPEED = 30;     // Скорость рывка
export const DASH_DURATION = 10;  // Длительность рывка в кадрах

export const FIRE_TYPE = "fire"; // название спрайта огня
export const FIRE_SPAWN_INTERVAL = 2000; // интервал появления огня в мс (2 секунды)
export const FIRE_FALL_SPEED = 6; // скорость падения
export const FIRE_COUNT = 7; // количество одновременно активных огней

export function isSolidTile(tileId) {
    return tileId != 55 && tileId != 56 && tileId != 46;
}

// Стартовые позиции для уровня 1
export const PLAYER_START_X_LEVEL1 = 0;
export const PLAYER_START_Y_LEVEL1 = 1024;

// Стартовые позиции для уровня 2
export const PLAYER_START_X_LEVEL2 = 0;
export const PLAYER_START_Y_LEVEL2 = 2880;

export const ENEMY_TYPES = ["enemy_1", "enemy_2", "enemy_3"];

export const maps = ["lvl1.json", "lvl2.json"];

export const enemiesPositionsLevel1 = [
    {x: 300, y: 1024, type: 0},
    {x: 600, y: 1024, type: 1},
    {x: 1200, y: 1024, type: 2},
    {x: 2000, y: 1024, type: 0},
    {x: 2800, y: 1024, type: 1},
    {x: 3500, y: 1024, type: 2},
    {x: 900, y: 900, type: 0},
    {x: 1200, y: 600, type: 1},
    {x: 2300, y: 900, type: 2},
    {x: 3100, y: 900, type: 0},
    {x: 1500, y: 600, type: 0},
    {x: 1900, y: 600, type: 1},
    {x: 2700, y: 600, type: 2},
    {x: 3300, y: 640, type: 0},
];

export const enemiesPositionsLevel2 = [
    {x: 256, y: 2848, type: 0},
    {x: 256, y: 2304, type: 1},
    {x: 256, y: 1760, type: 2},
    {x: 256, y: 1216, type: 0},
    {x: 256, y: 672, type: 1},
    {x: 256, y: 288, type: 2},
    {x: 448, y: 2200, type: 0},
    {x: 448, y: 2656, type: 1},
    {x: 448, y: 1216, type: 0},
    {x: 448, y: 972, type: 1},
    {x: 448, y: 288, type: 2},
    {x: 640, y: 1500, type: 1},
    {x: 640, y: 1216, type: 0},
    {x: 640, y: 972, type: 1},
    {x: 640, y: 88, type: 2},
    {x: 1152, y: 2300, type: 1},
    {x: 1152, y: 1216, type: 0},
    {x: 1120, y: 972, type: 1},
    {x: 1120, y: 88, type: 2},
];

export const fireSpawnPositions = [
    {x: 70},
    {x: 210},
    {x: 350},
    {x: 490},
    {x: 630},
    {x: 770},
    {x: 910},
    {x: 1050},
    {x: 1190},
];
