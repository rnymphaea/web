import { physicManager } from "./physics.js";
import { eventsManager } from "./events.js";
import { mapManager } from "./map.js";
import { ctx } from "./app.js";

export let gameManager = {
    player: null,
    gameLoopInterval: null,
    isRunning: false,
    
    init: function(player) {
        this.player = player;
        eventsManager.setup();
        this.startGameLoop();
    },
    
    startGameLoop: function() {
        this.isRunning = true;
        
        // Основной игровой цикл
        const gameLoop = () => {
            if (!this.isRunning) return;
            
            this.update();
            this.draw();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    },
    
    update: function() {
        if (!this.player) return;
        
        // Обновляем управление
        this.player.move_x = eventsManager.action['runRight'] ? 1 : 
                           (eventsManager.action['runLeft'] ? -1 : 0);
        
        this.player.isJumping = eventsManager.action['jump'] || false;
        
        // Обновляем физику только если карта загружена
        if (mapManager.jsonLoaded && mapManager.imgLoaded) {
            physicManager.update(this.player);
        }
        
        // Обновляем анимации игрока
        this.player.update();
        
        // Центрируем камеру на игроке
        if (mapManager.jsonLoaded) {
            mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        }
    },
    
    draw: function() {
        // Очищаем канвас
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Рисуем карту - метод draw сам проверит загрузку
        mapManager.draw(ctx);
        
        // Рисуем игрока
        if (this.player) {
            this.player.draw(ctx);
        }
    },
    
    stop: function() {
        this.isRunning = false;
    }
};
