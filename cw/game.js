import { physicManager } from "./physics.js";
import { eventsManager } from "./events.js";
import { mapManager } from "./map.js";
import { createEnemy } from "./entity.js";
import { enemiesPositionsLevel1 } from "./utils.js";
import { ctx } from "./app.js";

export let gameManager = {
    player: null,
    enemies: [],
    gameLoopInterval: null,
    isRunning: false,
    gameOver: false,
    gameWon: false,
    
    init: function(player) {
        this.player = player;
        eventsManager.setup();
        this.spawnEnemies();
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
    
    update: function() {
        if (!this.player || !this.player.isAlive || this.gameOver) return;
        
        // Проверяем загрузку карты как в учебнике
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || 
            !mapManager.tLayer || !mapManager.tLayer.data) {
            console.log('Ожидание загрузки карты для обновления игры...');
            return;
        }
        
        // Проверка достижения правого края карты (победа)
        if (this.player.pos_x >= mapManager.mapSize.x - this.player.size_x - 3) {
            this.gameWon = true;
            this.gameOver = true;
            this.updateGameStatus();
            return;
        }
        
        // Обновляем управление
        this.player.move_x = eventsManager.action['runRight'] ? 1 : 
                           (eventsManager.action['runLeft'] ? -1 : 0);
        
        this.player.isJumping = eventsManager.action['jump'] || false;
        
        // Обработка атаки мыши
        if (eventsManager.action['attack']) {
            this.player.startAttack();
        }
        
        // Обработка рывка (Shift)
        if (eventsManager.action['dash']) {
            this.player.startDash();
        }
        
        // Обновляем физику
        physicManager.update(this.player);
        
        // Обновляем игрока (анимации)
        this.player.update();
        
        // Обновляем врагов
        this.updateEnemies();
        
        // Проверяем столкновения с врагами
        this.checkEnemyCollisions();
        
        // Проверяем падение в пропасть
        this.checkFallDeath();
        
        // Центрируем камеру
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        
        // Обновляем статус игры
        this.updateGameStatus();
    },
    
    updateEnemies: function() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (enemy.isAlive) {
                enemy.update(this.player);

                // Проверяем загрузку карты перед физикой врага
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
        
        // Удаляем мертвых врагов
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    },
    
    checkEnemyCollisions: function() {
        for (let enemy of this.enemies) {
            if (enemy.isAlive && this.player.isCollidingWith(enemy)) {
                this.player.isAlive = false;
                this.gameOver = true;
                console.log("Игрок погиб от врага!");
                break;
            }
        }
    },
    
    checkFallDeath: function() {
        if (this.player.pos_y > mapManager.mapSize.y + 100) {
            this.player.isAlive = false;
            this.gameOver = true;
            console.log("Игрок упал в пропасть!");
        }
    },
    
    updateGameStatus: function() {
        const statusElement = document.getElementById('gameStatus');
        
        if (this.gameWon) {
            statusElement.textContent = 'Победа! Вы достигли конца уровня!';
            statusElement.style.color = 'green';
        } else if (!this.player.isAlive) {
            statusElement.textContent = 'Игра окончена! Вы погибли.';
            statusElement.style.color = 'red';
        } else {
            const progress = Math.min(100, Math.floor((this.player.pos_x / mapManager.mapSize.x) * 100));
            statusElement.textContent = `Прогресс: ${progress}% | Врагов: ${this.enemies.length} | Рывков: ${this.player.dashCharges}`;
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
    }
};
