import { physicManager } from "./physics.js";
import { eventsManager } from "./events.js";
import { mapManager } from "./map.js";
import { createEnemy, createFire } from "./entity.js";
import { enemiesPositionsLevel1, enemiesPositionsLevel2 } from "./utils.js";
import { ctx, nextLevel, soundManager } from "./app.js";
import { FIRE_SPAWN_INTERVAL, FIRE_COUNT, fireSpawnPositions } from "./utils.js";

let gameStartTime = 0;
let gameTimerInterval = null;
let animationFrameId = null;

export let gameManager = {
    player: null,
    enemies: [],
    fires: [],
    isRunning: false,
    gameOver: false,
    gameWon: false,
    gameTime: 0,
    currentLevel: 0,
    lastTime: 0,
    lastFireSpawn: 0,
    
    init: function(player, levelIndex) {
        console.log(`Инициализация уровня ${levelIndex + 1}`);
        
        this.stop();
        this.player = player;
        this.currentLevel = levelIndex;
        this.gameTime = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.lastTime = performance.now();
        this.fires = [];
        this.lastFireSpawn = Date.now();
        
        eventsManager.setup();
        this.spawnEnemies();
        this.startTimer();
        this.startGameLoop();
    },
    
    spawnEnemies: function() {
        this.enemies = [];
        
        // Получаем данные врагов из mapManager
        const enemyDataList = mapManager.entities.enemies;
        
        if (enemyDataList && enemyDataList.length > 0) {
            enemyDataList.forEach(enemyData => {
                let enemy = createEnemy(enemyData.enemyType || 0);
                
                // Устанавливаем позицию и размер из объекта Tiled
                enemy.pos_x = enemyData.x;
                enemy.pos_y = enemyData.y;
                enemy.size_x = enemyData.width || 32;
                enemy.size_y = enemyData.height || 32;
                
                // Применяем дополнительные свойства
                if (enemyData.name) {
                    enemy.name = enemyData.name;
                }
                
                this.enemies.push(enemy);
                console.log(`Создан враг: ${enemyData.name || 'enemy'} на (${enemy.pos_x}, ${enemy.pos_y})`);
            });
        } else {
            // Резервный вариант - старые константы
            console.warn("Враги не найдены в карте, используем константы");
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
        }
        
        console.log(`Создано врагов: ${this.enemies.length} на уровне ${this.currentLevel + 1}`);
    },
    
    spawnFire: function() {
        // Огонь появляется только на втором уровне (уровень 1)
        if (this.currentLevel !== 1 || this.fires.length >= FIRE_COUNT) {
            return;
        }
        
        const now = Date.now();
        if (now - this.lastFireSpawn < FIRE_SPAWN_INTERVAL) {
            return;
        }
        
        // Получаем точки спавна огня из карты или используем старые константы
        let spawnPoints = [];
        const fireSpawnData = mapManager.entities.fireSpawnPoints;
        
        if (fireSpawnData && fireSpawnData.length > 0) {
            // Используем точки из карты
            spawnPoints = fireSpawnData;
            console.log(`Используем ${spawnPoints.length} точек спавна огня из карты`);
        } else {
            // Резервный вариант - старые константы
            console.warn("Точки спавна огня не найдены в карте, используем константы");
            spawnPoints = fireSpawnPositions.map(pos => ({
                x: pos.x,
                y: -50  // Стартовая позиция выше экрана
            }));
        }
        
        if (spawnPoints.length === 0) {
            console.warn("Нет доступных точек спавна для огня");
            return;
        }
        
        // Выбираем случайную точку спавна
        const spawnPos = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        let fire = createFire(spawnPos.x, spawnPos.y);
        this.fires.push(fire);
        
        this.lastFireSpawn = now;
        console.log(`Создан огненный шар на позиции: (${spawnPos.x}, ${spawnPos.y})`);
    },
    
    startTimer: function() {
        this.gameTime = 0;
        gameStartTime = Date.now();
        
        let timerElement = document.getElementById('gameTimer');
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.className = 'timer-display';
            timerElement.id = 'gameTimer';
            document.querySelector('main').appendChild(timerElement);
        }
        
        if (gameTimerInterval) clearInterval(gameTimerInterval);
        
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
            
            const deltaTime = Math.min(currentTime - this.lastTime, 100) / 16.67;
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
        
        if (progress === 100 || this.gameWon) {
            const record = {
                name: playerName,
                time: this.gameTime,
                progress: 100,
                level: this.currentLevel + 1
            };
            
            let records = localStorage.getItem('gameRecords');
            if (!records) {
                records = [];
            } else {
                try {
                    records = JSON.parse(records);
                    if (!Array.isArray(records)) {
                        records = [];
                    }
                } catch (error) {
                    console.error('Ошибка парсинга рекордов:', error);
                    records = [];
                }
            }
            
            records.push(record);
            localStorage.setItem('gameRecords', JSON.stringify(records));
            
            console.log('Рекорд сохранен:', record);
        }
    },
    
    update: function(deltaTime = 1) {
        if (!this.player || !this.player.isAlive || this.gameOver) return;
        
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || 
            !mapManager.tLayers || mapManager.tLayers.length === 0) {
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
            }, 2000);
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
        this.updateFires(deltaTime);
        this.checkEnemyCollisions();
        this.checkFireCollisions();
        this.checkFallDeath();
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.updateGameStatus();
    },
    
    checkLevelComplete: function() {
        if (this.currentLevel === 0) {
            return this.player.pos_x >= mapManager.mapSize.x - this.player.size_x - 3;
        } else if (this.currentLevel === 1) {
            return this.player.pos_y < 5;
        }
        return false;
    },
    
    updateEnemies: function(deltaTime = 1) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (enemy.isAlive) {
                enemy.update(this.player);

                if (mapManager.jsonLoaded && mapManager.imgLoaded && 
                    mapManager.tLayers && mapManager.tLayers.length > 0) {
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
    
    updateFires: function(deltaTime = 1) {
        this.spawnFire();
        
        for (let i = this.fires.length - 1; i >= 0; i--) {
            let fire = this.fires[i];
            
            if (fire.isActive) {
                fire.update();
                
                if (!fire.isActive || fire.pos_y > mapManager.mapSize.y + 100) {
                    this.fires.splice(i, 1);
                    continue;
                }
            } else {
                this.fires.splice(i, 1);
            }
        }
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
    
    checkFireCollisions: function() {
        for (let fire of this.fires) {
            if (fire.isActive && fire.isCollidingWithPlayer(this.player)) {
                this.player.isAlive = false;
                this.gameOver = true;
                this.saveRecord();
                console.log("Игрок погиб от огня!");
                
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
            const fireCount = this.fires.filter(f => f.isActive).length;
            statusElement.textContent = `Уровень ${this.currentLevel + 1} | ${progress} | Время: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} | Врагов: ${this.enemies.length} | Рывков: ${this.player.dashCharges} | Огней: ${fireCount}`;
            statusElement.style.color = 'white';
        }
    },
    
    getProgress: function() {
        if (this.currentLevel === 0) {
            const progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
            return `Прогресс: ${progress}%`;
        } else if (this.currentLevel === 1) {
            const progress = Math.min(100, Math.floor((1 - this.player.pos_y / mapManager.mapSize.y) * 100));
            return `Прогресс: ${progress}%`;
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
        
        this.fires.forEach(fire => {
            if (fire.isActive) {
                fire.draw(ctx);
            }
        });
        
        // Отладочная отрисовка точек спавна огня
        if (false) { // Поставьте true для отладки
            const fireSpawns = mapManager.entities.fireSpawnPoints;
            if (fireSpawns && fireSpawns.length > 0) {
                fireSpawns.forEach(spawn => {
                    ctx.fillStyle = 'rgba(255, 165, 0, 0.5)'; // Оранжевый с прозрачностью
                    ctx.fillRect(
                        spawn.x - mapManager.view.x,
                        spawn.y - mapManager.view.y,
                        spawn.width || 10,
                        spawn.height || 10
                    );
                });
            }
        }
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
        
        this.fires = [];
        
        const timerElement = document.getElementById('gameTimer');
        if (timerElement) {
            timerElement.remove();
        }
    }
};
