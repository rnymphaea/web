import { mapManager } from "./map.js";
import { emptyCell, isSolidTile } from "./utils.js";

export let physicManager = {
    gravity: 0.8,
    jumpPower: 16,
    maxFallSpeed: 20,
    
    update: function(obj){
        // Если карта не загружена, ничего не делаем
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || !mapManager.tLayer) {
            return;
        }
        
        // Проверяем на земле ли игрок
        let onGround = this.isOnGround(obj);
        
        // Если на земле - сбрасываем счетчик прыжков
        if (onGround) {
            obj.jumpCount = 0;
        }
        
        // Обработка прыжка
        if (obj.isJumping && obj.jumpCount < 2) {
            obj.velocityY = -this.jumpPower;
            obj.jumpCount++;
        }
        
        // Применяем гравитацию
        obj.velocityY += this.gravity;
        
        // Ограничиваем максимальную скорость падения
        if (obj.velocityY > this.maxFallSpeed) {
            obj.velocityY = this.maxFallSpeed;
        }
        
        // Применяем вертикальное движение
        obj.pos_y += obj.velocityY;
        
        // Если мы под землей после движения, выравниваем
        if (this.isUnderGround(obj)) {
            this.alignToGround(obj);
            obj.velocityY = 0;
            obj.jumpCount = 0;
        }
        
        // Движение по горизонтали - ПРОСТАЯ ПРОВЕРКА
        if (obj.move_x !== 0) {
            let newX = obj.pos_x + (obj.move_x * obj.speed);
            
            // Очень простая проверка - только границы карты
            if (newX >= 0 && newX + obj.size_x <= mapManager.mapSize.x) {
                obj.pos_x = newX;
            }
        }
    },
    
    isOnGround: function(obj){
        // Простая проверка - если под ногами земля
        let checkY = obj.pos_y + obj.size_y + 1;
        
        // Проверяем левую и правую точку под ногами
        let leftTile = mapManager.getTilesetIdx(obj.pos_x + 5, checkY);
        let rightTile = mapManager.getTilesetIdx(obj.pos_x + obj.size_x - 5, checkY);
        
        return isSolidTile(leftTile) || isSolidTile(rightTile);
    },
    
    isUnderGround: function(obj){
        // Проверяем не застряли ли мы в земле
        let checkY = obj.pos_y + obj.size_y;
        
        // Проверяем несколько точек
        let points = [
            obj.pos_x + 8,
            obj.pos_x + obj.size_x / 2,
            obj.pos_x + obj.size_x - 8
        ];
        
        for (let pointX of points) {
            let tileId = mapManager.getTilesetIdx(pointX, checkY);
            if (isSolidTile(tileId)) {
                return true;
            }
        }
        
        return false;
    },
    
    alignToGround: function(obj){
        // Поднимаем игрока пока он не выйдет из земли
        let attempts = 0;
        while (this.isUnderGround(obj) && attempts < 10) {
            obj.pos_y -= 2; // Поднимаем на 2px
            attempts++;
        }
        
        // Если все еще под землей, ищем землю сверху
        if (this.isUnderGround(obj)) {
            // Ищем самую верхнюю позицию над землей
            let groundLevel = this.findGroundLevel(obj);
            if (groundLevel !== null) {
                obj.pos_y = groundLevel - obj.size_y;
            }
        }
    },
    
    findGroundLevel: function(obj){
        // Ищем уровень земли под игроком
        for (let y = obj.pos_y + obj.size_y; y >= 0; y--) {
            let leftTile = mapManager.getTilesetIdx(obj.pos_x + 8, y);
            let rightTile = mapManager.getTilesetIdx(obj.pos_x + obj.size_x - 8, y);
            
            if (!isSolidTile(leftTile) && !isSolidTile(rightTile)) {
                return y; // Нашли пустое место
            }
        }
        return null;
    }
};
