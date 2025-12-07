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
            mapManager.tLayers && mapManager.tLayers.length > 0) {
            
            try {
                let player = createPlayer();
                
                // Используем позицию из объектов карты
                const playerData = mapManager.entities.player;
                
                if (playerData) {
                    // Устанавливаем позицию из объекта Player в Tiled
                    player.pos_x = playerData.x;
                    player.pos_y = playerData.y;
                    player.size_x = playerData.width || 32;
                    player.size_y = playerData.height || 32;
                    
                    console.log("Игрок создан на позиции из карты:", player.pos_x, player.pos_y);
                } else {
                    // Резервный вариант - старые константы
                    console.warn("Объект Player не найден в карте, используем константы");
                    if (currentLevel === 0) {
                        player.pos_x = PLAYER_START_X_LEVEL1;
                        player.pos_y = PLAYER_START_Y_LEVEL1;
                    } else {
                        player.pos_x = PLAYER_START_X_LEVEL2;
                        player.pos_y = PLAYER_START_Y_LEVEL2;
                    }
                }
                
                player.isAlive = true;
                player.dashCharges = 0;
                
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
    
    mapManager.clearMap();
    gameManager.stop();
    mapManager.loadMap(maps[levelIndex], "map");
    
    if (!spriteManager.imgLoaded || !spriteManager.jsonLoaded) {
        spriteManager.loadAtlas("map/sprites.json", "map/spritesheet.png");
    }
    
    setTimeout(() => {
        initializeGame();
    }, 500);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    soundManager.init();
    soundManager.loadArray([
        "sound/attack.mp3",
        "sound/win.mp3", 
        "sound/lose.mp3"
    ]);
    
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted) return;
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

export function nextLevel() {
    if (currentLevel + 1 < maps.length) {
        setTimeout(() => {
            loadLevel(currentLevel + 1);
        }, 2000);
    } else {
        setTimeout(() => {
            gameManager.stop();
            document.getElementById('gameStatus').textContent = 'Все уровни пройдены!';
            document.getElementById('gameStatus').style.color = 'green';
            gameStarted = false;
        }, 2000);
    }
}

export { soundManager };
