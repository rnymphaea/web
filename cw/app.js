import { mapManager } from "./map.js";
import { spriteManager } from "./sprite.js";
import { createPlayer } from "./entity.js";

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let gameStarted = false;
let player = null;

// Константы
const maps = ["lvl1.json"];

function initializeGame() {
    mapManager.loadMap(maps[0], "map");
    
    spriteManager.loadAtlas("map/sprites.json", "map/spritesheet.png");
    
    player = createPlayer();
    
    const checkAndDraw = () => {
        if (mapManager.imgLoaded && mapManager.jsonLoaded && 
            spriteManager.imgLoaded && spriteManager.jsonLoaded) {
            try {
                // Очищаем канвас
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Рисуем карту
                mapManager.draw(ctx);
                
                // Рисуем игрока
                player.draw(ctx);
                
                // Центрируем камеру на игроке
                mapManager.centerAt(player.pos_x, player.pos_y);
                
                document.getElementById('gameStatus').textContent = 'Игрок на карте!';
                console.log('Игрок создан на позиции:', player.pos_x, player.pos_y);
                console.log('Доступные спрайты:', spriteManager.sprites.length);
                
                // Выводим список доступных спрайтов для отладки
                spriteManager.sprites.forEach((sprite, i) => {
                    console.log(i + 1, sprite.name);
                });
            } catch (error) {
                document.getElementById('gameStatus').textContent = 'Ошибка при отрисовке';
                console.error('Ошибка отрисовки:', error);
            }
        } else {
            setTimeout(checkAndDraw, 100);
        }
    };
    
    checkAndDraw();
}

// Управление камерой для перемещения
document.addEventListener('keydown', (e) => {
    if (!mapManager.imgLoaded || !mapManager.jsonLoaded) return;
    
    const moveSpeed = 50;
    const view = mapManager.view;
    
    switch(e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            view.y = Math.max(0, view.y - moveSpeed);
            break;
        case 'arrowdown':
        case 's':
            view.y = Math.min(mapManager.mapSize.y - view.h, view.y + moveSpeed);
            break;
        case 'arrowleft':
        case 'a':
            view.x = Math.max(0, view.x - moveSpeed);
            break;
        case 'arrowright':
        case 'd':
            view.x = Math.min(mapManager.mapSize.x - view.w, view.x + moveSpeed);
            break;
        case 'r': // Сброс камеры на игрока
            if (player) {
                mapManager.centerAt(player.pos_x, player.pos_y);
            }
            break;
        default:
            return;
    }
    
    // Перерисовываем
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mapManager.draw(ctx);
    if (player) player.draw(ctx);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted) {
            return;
        }
        gameStarted = true;
        document.getElementById('gameStatus').textContent = 'Загрузка карты и спрайтов...';
        console.log('Начало загрузки');
        
        initializeGame();
    });
    
    document.getElementById("endGame").addEventListener('click', () => {
        gameStarted = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('gameStatus').textContent = 'Сброшено';
        
        // Сбрасываем менеджер карты
        mapManager.clearMap();
        console.log('Сброшено');
    });
});

console.log('app.js загружен');
