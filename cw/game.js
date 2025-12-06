import { physicManager } from "./physics.js";
import { eventsManager } from "./events.js";
import { mapManager } from "./map.js";
import { createEnemy } from "./entity.js";
import { enemiesPositionsLevel1, enemiesPositionsLevel2 } from "./utils.js";
import { ctx, nextLevel, soundManager } from "./app.js";

let gameStartTime = 0;
let gameTimerInterval = null;
let animationFrameId = null;

export let gameManager = {
    player: null,
    enemies: [],
    isRunning: false,
    gameOver: false,
    gameWon: false,
    gameTime: 0,
    currentLevel: 0,
    lastTime: 0,
    
    init: function(player, levelIndex) {
        console.log(`Инициализация уровня ${levelIndex + 1}`);
        
        // Останавливаем предыдущий игровой цикл
        this.stop();
        
        this.player = player;
        this.currentLevel = levelIndex;
        this.gameTime = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.lastTime = performance.now();
        
        eventsManager.setup();
        this.spawnEnemies();
        this.startTimer();
        this.startGameLoop();
    },
    
    spawnEnemies: function() {
        this.enemies = [];
        
        let enemyPositions;
        if (this.currentLevel === 0) {
            enemyPositions = enemiesPositionsLevel1;
        } else {
            enemyPositions = enemiesPositionsLevel2;
        }
        
        enemyPositions.forEach(enemyData => {
            let enemy = createEnemy(enemyData.type);
            enemy.pos_x = enemyData.x;
            enemy.pos_y = enemyData.y;
            this.enemies.push(enemy);
        });
        
        console.log(`Создано врагов: ${this.enemies.length} на уровне ${this.currentLevel + 1}`);
    },
    
    startTimer: function() {
        this.gameTime = 0;
        gameStartTime = Date.now();
        
        // Создаем элемент для отображения таймера
        let timerElement = document.getElementById('gameTimer');
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.className = 'timer-display';
            timerElement.id = 'gameTimer';
            document.querySelector('main').appendChild(timerElement);
        }
        
        // Обновляем таймер каждую секунду
        if (gameTimerInterval) {
            clearInterval(gameTimerInterval);
        }
        
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
            timerElement.textContent = `Уровень ${this.currentLevel + 1} | Время: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },
    
    startGameLoop: function() {
        this.isRunning = true;
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning) return;
            
            // Вычисляем deltaTime для фиксированного обновления
            const deltaTime = Math.min(currentTime - this.lastTime, 100) / 16.67; // Нормализуем к 60 FPS
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.draw();
            
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);
    },
    
    saveRecord: function() {
        const playerName = localStorage.getItem('playerName') || 'Игрок';
        let progress = 0;
        
        if (this.currentLevel === 0) {
            progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
        } else {
            progress = Math.min(100, Math.floor((1 - this.player.pos_y / mapManager.mapSize.y) * 100));
        }
        
        // Сохраняем запись только если игрок прошел уровень (прогресс 100%)
        if (progress === 100 || this.gameWon) {
            const record = {
                name: playerName,
                time: this.gameTime,
                progress: 100,
                level: this.currentLevel + 1
            };
            
            const records = JSON.parse(localStorage.getItem('gameRecords') || '[]');
            records.push(record);
            localStorage.setItem('gameRecords', JSON.stringify(records));
            
            console.log('Рекорд сохранен:', record);
        }
    },
    
    update: function(deltaTime = 1) {
        if (!this.player || !this.player.isAlive || this.gameOver) return;
        
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || 
            !mapManager.tLayer || !mapManager.tLayer.data) {
            console.log('Ожидание загрузки карты для обновления игры...');
            return;
        }
        
        if (this.checkLevelComplete()) {
            this.gameWon = true;
            this.gameOver = true;
            this.saveRecord();
            this.updateGameStatus();
            
            soundManager.play("sound/win.mp3", { volume: 0.7 });
            
            setTimeout(() => {
                nextLevel();
            }, 2000); // 2 секунды задержки
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
        
        const speedMultiplier = deltaTime;
        this.player.speed = 5 * speedMultiplier;
        
        physicManager.update(this.player);
        this.player.update();
        this.updateEnemies(deltaTime);
        this.checkEnemyCollisions();
        this.checkFallDeath();
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.updateGameStatus();
    },
    
    checkLevelComplete: function() {
        if (this.currentLevel === 0) {
            return this.player.pos_x >= mapManager.mapSize.x - this.player.size_x - 3;
        } else if (this.currentLevel === 1) {
            return this.player.pos_y < 100;
        }
        return false;
    },
    
    updateEnemies: function(deltaTime = 1) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (enemy.isAlive) {
                enemy.update(this.player);

                if (mapManager.jsonLoaded && mapManager.imgLoaded && 
                    mapManager.tLayer && mapManager.tLayer.data) {
                    const speedMultiplier = deltaTime;
                    enemy.speed = (1 + Math.random() * 1) * speedMultiplier;
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
                
                soundManager.play("sound/lose.mp3", { volume: 0.7 });
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
            
            soundManager.play("sound/lose.mp3", { volume: 0.7 });
        }
    },
    
    updateGameStatus: function() {
        const statusElement = document.getElementById('gameStatus');
        
        if (this.gameWon) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Уровень ${this.currentLevel + 1} пройден! Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            statusElement.style.color = 'green';
        } else if (!this.player.isAlive) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Поражение на уровне ${this.currentLevel + 1}! Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            statusElement.style.color = 'red';
        } else {
            const progress = this.getProgress();
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            statusElement.textContent = `Уровень ${this.currentLevel + 1} | ${progress} | Время: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} | Врагов: ${this.enemies.length} | Рывков: ${this.player.dashCharges}`;
            statusElement.style.color = 'white';
        }
    },
    
    getProgress: function() {
        if (this.currentLevel === 0) {
            const progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
            return `Прогресс: ${progress}%`;
        } else if (this.currentLevel === 1) {
            const progress = Math.min(100, Math.floor((1 - this.player.pos_y / mapManager.mapSize.y) * 100));
            return `Высота: ${progress}%`;
        }
        return '';
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
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
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
