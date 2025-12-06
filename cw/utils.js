// utils.js
export const emptyCell = 0;
export const ENEMY_DETECTION_RADIUS = 300;
export const ATTACK_COOLDOWN = 500;
export const ENEMY_ATTACK_COOLDOWN = 1000;

// Константы для рывка
export const DASH_DISTANCE = 200; // Дистанция рывка в пикселях
export const DASH_SPEED = 30;     // Скорость рывка (очень быстро)
export const DASH_DURATION = 10;  // Длительность рывка в кадрах

export function isSolidTile(tileId) {
    return tileId != 55 && tileId != 56;
}

export const PLAYER_START_X = 0;
export const PLAYER_START_Y = 1024;

export const ENEMY_TYPES = ["enemy_1", "enemy_2", "enemy_3"];


export const maps = ["lvl1.json"];


export const enemiesPositionsLevel1 = [
    // НА ЗЕМЛЕ (y = 1024)
    {x: 300, y: 1024, type: 0},   // В начале
    {x: 600, y: 1024, type: 1},   // После первой платформы
    {x: 1200, y: 1024, type: 2},  // Перед препятствиями
    {x: 2000, y: 1024, type: 0},  // В середине
    {x: 2800, y: 1024, type: 1},  // Перед финалом
    {x: 3500, y: 1024, type: 2},  // В конце
    
    // НА ПЛАТФОРМАХ ВЫСОТОЙ 900px (28 тайлов от верха)
    // Вижу платформы на ~строках 25-27 в данных карты
    {x: 900, y: 900, type: 0},    // Первая платформа
    {x: 1200, y: 600, type: 1},   // Средняя платформа  
    {x: 2300, y: 900, type: 2},   // После препятствий
    {x: 3100, y: 900, type: 0},   // Финальные платформы
    
    // НА ВЫСОКИХ ПЛАТФОРМАХ 768px (24 тайла от верха)
    // Платформы с тайлами 23-26
    {x: 1500, y: 600, type: 0},   // Первая высокая платформа
    {x: 1900, y: 600, type: 1},   // Вторая высокая
    {x: 2700, y: 600, type: 2},   // Третья высокая
    
    // НА ОЧЕНЬ ВЫСОКИХ ПЛАТФОРМАХ 640px (20 тайлов от верха)
    {x: 3300, y: 640, type: 0},   // Самая высокая платформа
];


