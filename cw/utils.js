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
    {x: 300, y: 1024, type: 0},   // В начале
    {x: 600, y: 1024, type: 1},   // После первой платформы
    {x: 1200, y: 1024, type: 2},  // Перед препятствиями
    {x: 2000, y: 1024, type: 0},  // В середине
    {x: 2800, y: 1024, type: 1},  // Перед финалом
    {x: 3500, y: 1024, type: 2},  // В конце
    
    {x: 900, y: 900, type: 0},    // Первая платформа
    {x: 1200, y: 600, type: 1},   // Средняя платформа  
    {x: 2300, y: 900, type: 2},   // После препятствий
    {x: 3100, y: 900, type: 0},   // Финальные платформы
    
    {x: 1500, y: 600, type: 0},   // Первая высокая платформа
    {x: 1900, y: 600, type: 1},   // Вторая высокая
    {x: 2700, y: 600, type: 2},   // Третья высокая
    
    {x: 3300, y: 640, type: 0},   // Самая высокая платформа
];

export const enemiesPositionsLevel2 = [
    // ВЕРТИКАЛЬНАЯ ЛИНИЯ ОБОРОНЫ при X = 256 (8 * 32)
    {x: 256, y: 2848, type: 0},   // Самый низ - первый враг (89 строка)
    {x: 256, y: 2304, type: 1},   // Средняя высота 1 (72 строка)
    {x: 256, y: 1760, type: 2},   // Средняя высота 2 (55 строка)
    {x: 256, y: 1216, type: 0},   // Выше среднего (38 строка)
    {x: 256, y: 672, type: 1},    // Высоко (21 строка)
    {x: 256, y: 288, type: 2},    // Почти у вершины (9 строка)

    {x: 448, y: 2200, type: 0},   // Самый низ - первый враг (89 строка)
    {x: 448, y: 2656, type: 1},   // Средняя высота 1 (72 строка)
    {x: 448, y: 1216, type: 0},   // Выше среднего (38 строка)
    {x: 448, y: 972, type: 1},    // Высоко (21 строка)
    {x: 448, y: 288, type: 2},

    {x: 640, y: 1500, type: 1},   // Самый низ - первый враг (89 строка)
    {x: 640, y: 1216, type: 0},   // Выше среднего (38 строка)
    {x: 640, y: 972, type: 1},    // Высоко (21 строка)
    {x: 640, y: 88, type: 2},

    {x: 1152, y: 2300, type: 1},   // Самый низ - первый враг (89 строка)
    {x: 1152, y: 1216, type: 0},   // Выше среднего (38 строка)
    {x: 1120, y: 972, type: 1},    // Высоко (21 строка)
    {x: 1120, y: 88, type: 2},
];

export const fireSpawnPositions = [
    {x: 70},    // 1/18 ширины (70px)
    {x: 210},   // 3/18 ширины (210px)
    {x: 350},   // 5/18 ширины (350px)
    {x: 490},   // 7/18 ширины (490px)
    {x: 630},   // Центр-лево (630px)
    {x: 770},   // Центр (770px) 
    {x: 910},   // Центр-право (910px)
    {x: 1050},  // 15/18 ширины (1050px)
    {x: 1190},  // 17/18 ширины (1190px)
];
