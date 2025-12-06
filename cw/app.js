import { mapManager } from "./map.js";
import { spriteManager } from "./sprite.js";
import { createPlayer } from "./entity.js";
import { gameManager } from "./game.js";
import { eventsManager } from "./events.js";
import { soundManager } from "./sound.js";
import { maps, PLAYER_START_X_LEVEL1, PLAYER_START_Y_LEVEL1, PLAYER_START_X_LEVEL2, PLAYER_START_Y_LEVEL2 } from "./utils.js";

let canvas = document.getElementById('gameCanvas');
export let ctx = canvas.getContext('2d');
let gameStarted = false;
let currentLevel = 0;
let levelLoading = false;

function initializeGame() {
    const checkAndInit = () => {
        if (mapManager.imgLoaded && mapManager.jsonLoaded && 
            mapManager.tLayer && mapManager.tLayer.data &&
            spriteManager.imgLoaded && spriteManager.jsonLoaded) {
            
            try {
                let player = createPlayer();
                
                if (currentLevel === 0) {
                    // Первый уровень - начальная позиция из utils
                    player.pos_x = PLAYER_START_X_LEVEL1;
                    player.pos_y = PLAYER_START_Y_LEVEL1;
                } else {
                    // Второй уровень - начинаем снизу на земле
                    player.pos_x = PLAYER_START_X_LEVEL2;
                    player.pos_y = PLAYER_START_Y_LEVEL2; // Самый низ карты
                }
                
                player.isAlive = true;
                player.dashCharges = 0; // Сбрасываем заряды рывков
                
                gameManager.init(player, currentLevel);
                
                document.getElementById('gameStatus').textContent = `Уровень ${currentLevel + 1} начался!`;
                document.getElementById('gameStatus').style.color = 'white';
                levelLoading = false;
                
            } catch (error) {
                document.getElementById('gameStatus').textContent = 'Ошибка инициализации';
                console.error('Ошибка инициализации:', error);
                levelLoading = false;
            }
        } else {
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
}

function loadLevel(levelIndex) {
    if (levelLoading) return;
    
    levelLoading = true;
    currentLevel = levelIndex;
    document.getElementById('gameStatus').textContent = `Загрузка уровня ${levelIndex + 1}...`;
    
    // Очищаем текущую карту
    mapManager.clearMap();
    
    // Останавливаем текущую игру
    gameManager.stop();
    
    // Загружаем новую карту
    mapManager.loadMap(maps[levelIndex], "map");
    
    // Загружаем спрайты (если еще не загружены)
    if (!spriteManager.imgLoaded || !spriteManager.jsonLoaded) {
        spriteManager.loadAtlas("map/sprites.json", "map/spritesheet.png");
    }
    
    // Ждем полной загрузки
    setTimeout(() => {
        initializeGame();
    }, 500);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    // Инициализируем менеджер звука
    soundManager.init();
    
    // Загружаем звуки
    soundManager.loadArray([
        "sound/jump.mp3",
        "sound/win.mp3", 
        "sound/lose.mp3"
    ]);
    
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted) {
            return;
        }
        gameStarted = true;
        currentLevel = 0;
        document.getElementById('gameStatus').textContent = 'Загрузка уровня 1...';
        console.log('Начало загрузки');
        
        loadLevel(0);
    });
    
    document.getElementById("toMenu").addEventListener('click', () => {
        gameStarted = false;
        levelLoading = false;
        gameManager.stop();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('gameStatus').textContent = 'Возврат в меню...';
        
        setTimeout(() => {
            window.location.href = 'entrance.html';
        }, 500);
    });
    
    document.getElementById("endGame").addEventListener('click', () => {
        gameStarted = false;
        levelLoading = false;
        gameManager.stop();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('gameStatus').textContent = 'Игра остановлена';
        
        mapManager.clearMap();
        console.log('Игра остановлена');
    });
});

console.log('app.js загружен');

// Экспортируем для использования в game.js
export function nextLevel() {
    if (currentLevel + 1 < maps.length) {
        setTimeout(() => {
            loadLevel(currentLevel + 1);
        }, 2000); // 2 секунды задержки перед следующим уровнем
    } else {
        // Все уровни пройдены
        setTimeout(() => {
            gameManager.stop();
            document.getElementById('gameStatus').textContent = 'Все уровни пройдены!';
            document.getElementById('gameStatus').style.color = 'green';
            gameStarted = false;
        }, 2000);
    }
}

// Экспортируем менеджер звука
export { soundManager };
