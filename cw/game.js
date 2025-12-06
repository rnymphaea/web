import { physicManager } from "./physics.js";
import { eventsManager } from "./events.js";
import { mapManager } from "./map.js";
import { createEnemy } from "./entity.js";
import { enemiesPositionsLevel1 } from "./utils.js";
import { ctx } from "./app.js";

let gameStartTime = 0;
let gameTimerInterval = null;

export let gameManager = {
    player: null,
    enemies: [],
    gameLoopInterval: null,
    isRunning: false,
    gameOver: false,
    gameWon: false,
    gameTime: 0,
    
    init: function(player) {
        this.player = player;
        eventsManager.setup();
        this.spawnEnemies();
        this.startTimer();
        this.startGameLoop();
    },
    
    spawnEnemies: function() {
        this.enemies = [];
        
        enemiesPositionsLevel1.forEach(enemyData => {
            let enemy = createEnemy(enemyData.type);
            enemy.pos_x = enemyData.x;
            enemy.pos_y = enemyData.y;
            this.enemies.push(enemy);
        });
        
        console.log(`Создано врагов: ${this.enemies.length}`);
    },
    
    startTimer: function() {
        this.gameTime = 0;
        gameStartTime = Date.now();
        
        // Создаем элемент для отображения таймера
        const timerElement = document.createElement('div');
        timerElement.className = 'timer-display';
        timerElement.id = 'gameTimer';
        document.querySelector('main').appendChild(timerElement);
        
        // Обновляем таймер каждую секунду
        gameTimerInterval = setInterval(() => {
            this.gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    },
    
    updateTimerDisplay: function() {
        const timerElement = document.getElementById('gameTimer');
        if (timerElement) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            timerElement.textContent = `Время: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    
    startGameLoop: function() {
        this.isRunning = true;
        this.gameOver = false;
        this.gameWon = false;
        
        const gameLoop = () => {
            if (!this.isRunning) return;
            
            this.update();
            this.draw();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    },
    
    saveRecord: function() {
        const playerName = localStorage.getItem('playerName') || 'Игрок';
        const progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
        
        const record = {
            name: playerName,
            time: this.gameTime,
            progress: progress,
            score: progress * 1000 - this.gameTime * 10,
            date: new Date().toISOString()
        };
        
        const records = JSON.parse(localStorage.getItem('gameRecords') || '[]');
        records.push(record);
        records.sort((a, b) => b.score - a.score || a.time - b.time);
        localStorage.setItem('gameRecords', JSON.stringify(records.slice(0, 20)));
        
        console.log('Рекорд сохранен:', record);
    },
    
    update: function() {
        if (!this.player || !this.player.isAlive || this.gameOver) return;
        
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || 
            !mapManager.tLayer || !mapManager.tLayer.data) {
            console.log('Ожидание загрузки карты для обновления игры...');
            return;
        }
        
        if (this.player.pos_x >= mapManager.mapSize.x - this.player.size_x - 3) {
            this.gameWon = true;
            this.gameOver = true;
            this.saveRecord();
            this.updateGameStatus();
            return;
        }
        
        this.player.move_x = eventsManager.action['runRight'] ? 1 : 
                           (eventsManager.action['runLeft'] ? -1 : 0);
        
        this.player.isJumping = eventsManager.action['jump'] || false;
        
        if (eventsManager.action['attack']) {
            this.player.startAttack();
        }
        
        if (eventsManager.action['dash']) {
            this.player.startDash();
        }
        
        physicManager.update(this.player);
        this.player.update();
        this.updateEnemies();
        this.checkEnemyCollisions();
        this.checkFallDeath();
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.updateGameStatus();
    },
    
    updateEnemies: function() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (enemy.isAlive) {
                enemy.update(this.player);

                if (mapManager.jsonLoaded && mapManager.imgLoaded && 
                    mapManager.tLayer && mapManager.tLayer.data) {
                    physicManager.update(enemy);
                }
                
                if (this.player.isAttackingEnemy(enemy)) {
                    enemy.isAlive = false;
                    console.log("Враг убит!");
                    this.player.addDashCharge();
                    console.log(`Добавлен заряд рывка! Всего зарядов: ${this.player.dashCharges}`);
                    continue;
                }
            }
        }
        
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    },
    
    checkEnemyCollisions: function() {
        for (let enemy of this.enemies) {
            if (enemy.isAlive && this.player.isCollidingWith(enemy)) {
                this.player.isAlive = false;
                this.gameOver = true;
                this.saveRecord();
                console.log("Игрок погиб от врага!");
                break;
            }
        }
    },
    
    checkFallDeath: function() {
        if (this.player.pos_y > mapManager.mapSize.y + 100) {
            this.player.isAlive = false;
            this.gameOver = true;
            this.saveRecord();
            console.log("Игрок упал в пропасть!");
        }
    },
    
    updateGameStatus: function() {
        const statusElement = document.getElementById('gameStatus');
        
        if (this.gameWon) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Победа! Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            statusElement.style.color = 'green';
        } else if (!this.player.isAlive) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Поражение! Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            statusElement.style.color = 'red';
        } else {
            const progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Прогресс: ${progress}% | Время: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} | Врагов: ${this.enemies.length} | Рывков: ${this.player.dashCharges}`;
            statusElement.style.color = 'white';
        }
    },
    
    draw: function() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        mapManager.draw(ctx);
        
        if (this.player && this.player.isAlive) {
            this.player.draw(ctx);
        }
        
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(ctx);
            }
        });
    },
    
    stop: function() {
        this.isRunning = false;
        if (gameTimerInterval) {
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }
        
        const timerElement = document.getElementById('gameTimer');
        if (timerElement) {
            timerElement.remove();
        }
    }
};
