// app.js
import { mapManager } from "./map.js";

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let gameStarted = false;

// Константы
const emptyCell = 0;
const maps = ["lvl1.json"];

function initializeGame() {
    // Загружаем карту
    mapManager.loadMap(maps[0], "map");
    
    // Ждем загрузки и рисуем
    const checkAndDraw = () => {
        if (mapManager.imgLoaded && mapManager.jsonLoaded) {
            try {
                // Очищаем канвас
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Рисуем карту
                mapManager.draw(ctx);
                document.getElementById('gameStatus').textContent = 'Карта загружена успешно!';
                console.log('Карта отрисована');
                console.log('Размер карты:', mapManager.xCount, 'x', mapManager.yCount);
                console.log('Размер тайла:', mapManager.tSize.x, 'x', mapManager.tSize.y);
            } catch (error) {
                document.getElementById('gameStatus').textContent = 'Ошибка при отрисовке карты';
                console.error('Ошибка отрисовки:', error);
            }
        } else {
            setTimeout(checkAndDraw, 100);
        }
    };
    
    checkAndDraw();
}

// Управление камерой
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
        case 'r':
            view.x = 0;
            view.y = 0;
            break;
        default:
            return;
    }
    
    // Перерисовываем карту
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mapManager.draw(ctx);
    console.log('Камера перемещена:', view.x, view.y);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted) {
            return;
        }
        gameStarted = true;
        document.getElementById('gameStatus').textContent = 'Загрузка карты...';
        console.log('Начало загрузки карты');
        
        initializeGame();
    });
    
    document.getElementById("endGame").addEventListener('click', () => {
        gameStarted = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('gameStatus').textContent = 'Карта сброшена';
        
        // Сбрасываем менеджер карты
        mapManager.clearMap();
        console.log('Карта сброшена');
    });
});

console.log('app.js загружен');
