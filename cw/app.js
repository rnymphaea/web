import { mapManager } from "./map.js";
import { spriteManager } from "./sprite.js";
import { createPlayer } from "./entity.js";
import { gameManager } from "./game.js";
import { eventsManager } from "./events.js";
import { maps, PLAYER_START_X, PLAYER_START_Y } from "./utils.js";

let canvas = document.getElementById('gameCanvas');
export let ctx = canvas.getContext('2d');
let gameStarted = false;

function preloadGame(mapPath) {
    mapManager.loadMap(mapPath, "map");
    spriteManager.loadAtlas("map/sprites.json", "map/spritesheet.png");
}

function initializeGame() {
    const checkAndInit = () => {
        if (mapManager.imgLoaded && mapManager.jsonLoaded && 
            spriteManager.imgLoaded && spriteManager.jsonLoaded) {
            
            try {
                let player = createPlayer();
                player.pos_x = PLAYER_START_X;
                player.pos_y = PLAYER_START_Y;
                player.isAlive = true;
                
                gameManager.init(player);
                
                document.getElementById('gameStatus').textContent = 'Игра началась!';
                document.getElementById('gameStatus').style.color = 'white';
                
            } catch (error) {
                document.getElementById('gameStatus').textContent = 'Ошибка инициализации';
                console.error('Ошибка инициализации:', error);
            }
        } else {
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    // Только "Начать игру" и "Остановить"
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted) {
            return;
        }
        gameStarted = true;
        document.getElementById('gameStatus').textContent = 'Загрузка...';
        console.log('Начало загрузки');
        
        preloadGame(maps[0]);
        initializeGame();
    });
    
    document.getElementById("endGame").addEventListener('click', () => {
        gameStarted = false;
        gameManager.stop();
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('gameStatus').textContent = 'Игра остановлена';
        
        mapManager.clearMap();
        console.log('Игра остановлена');
    });
});

console.log('app.js загружен');
