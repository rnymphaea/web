import { mapManager } from "./map.js";
import { emptyCell, isSolidTile, DASH_SPEED, DASH_DURATION } from "./utils.js";

export let physicManager = {
    gravity: 0.8,
    jumpPower: 16,
    maxFallSpeed: 20,
    
    update: function(obj){
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || !mapManager.tLayer) {
            return;
        }
        
        let onGround = this.isOnGround(obj);
        
        if (onGround) {
            obj.jumpCount = 0;
        }
        
        let canJump = !this.isHittingCeiling(obj);
        
        if (obj.isJumping && obj.jumpCount < 2 && canJump) {
            obj.velocityY = -this.jumpPower;
            obj.jumpCount++;
        }
        
        obj.velocityY += this.gravity;
        
        if (obj.velocityY > this.maxFallSpeed) {
            obj.velocityY = this.maxFallSpeed;
        }
        
        if (obj.velocityY < 0 && this.isHittingCeiling(obj)) {
            obj.velocityY = 0;
        }
        
        obj.pos_y += obj.velocityY;
        
        if (this.isUnderGround(obj)) {
            this.alignToGround(obj);
            obj.velocityY = 0;
            obj.jumpCount = 0;
        }
        
        if (obj.isDashing && obj.dashTimer > 0) {
            this.updateDash(obj);
        } else {
            if (obj.move_x !== 0) {
                let newX = obj.pos_x + (obj.move_x * obj.speed);
                
                if (newX < 0) {
                    newX = 0;
                }
                
                if (obj.move_x < 0) {
                    if (!this.isBlockedLeft(obj, newX) && newX >= 0) {
                        obj.pos_x = newX;
                    }
                }
                else if (obj.move_x > 0) {
                    if (!this.isBlockedRight(obj, newX)) {
                        obj.pos_x = newX;
                    }
                }
            }
        }
    },
    
    // ФИЗИКА РЫВКА
    updateDash: function(obj) {
        // Уменьшаем таймер рывка
        obj.dashTimer--;
        
        // Получаем направление рывка
        const dashDirection = obj.dashDirection || (obj.lastDirection === "right" ? 1 : -1);
        const dashSpeed = DASH_SPEED;
        
        // Вычисляем новую позицию
        let newX = obj.pos_x + (dashDirection * dashSpeed);
        
        // ПРОВЕРКА ГРАНИЦ КАРТЫ ДЛЯ РЫВКА: X не может быть меньше 0
        if (newX < 0) {
            newX = 0;
            obj.isDashing = false; // Останавливаем рывок если уперлись в левую границу
            obj.dashTimer = 0;
            return;
        }
        
        // Проверяем столкновение для рывка
        if (dashDirection > 0) { // Рывок вправо
            if (!this.isBlockedRight(obj, newX)) {
                obj.pos_x = newX;
            } else {
                // Если столкнулись - останавливаем рывок
                obj.isDashing = false;
                obj.dashTimer = 0;
            }
        } else { // Рывок влево
            if (!this.isBlockedLeft(obj, newX) && newX >= 0) {
                obj.pos_x = newX;
            } else {
                // Если столкнулись - останавливаем рывок
                obj.isDashing = false;
                obj.dashTimer = 0;
            }
        }
        
        // Если таймер рывка закончился
        if (obj.dashTimer <= 0) {
            obj.isDashing = false;
            obj.dashTimer = 0;
        }
        
        // Вертикальная физика во время рывка (гравитация работает)
        let onGround = this.isOnGround(obj);
        
        if (!onGround) {
            obj.velocityY += this.gravity;
            if (obj.velocityY > this.maxFallSpeed) {
                obj.velocityY = this.maxFallSpeed;
            }
            obj.pos_y += obj.velocityY;
            
            // Проверяем не застряли ли мы в земле
            if (this.isUnderGround(obj)) {
                this.alignToGround(obj);
                obj.velocityY = 0;
            }
        } else {
            obj.velocityY = 0;
        }
    },
    
    // Проверка блокировки слева
    isBlockedLeft: function(obj, newX) {
        // ПРОВЕРКА ГРАНИЦ: не выходим за левый край карты
        if (newX < 0) {
            return true;
        }
        
        // Проверяем левый верхний угол
        let leftTopTile = mapManager.getTilesetIdx(newX + 1, obj.pos_y + 1);
        // Проверяем левый нижний угол
        let leftBottomTile = mapManager.getTilesetIdx(newX + 1, obj.pos_y + obj.size_y - 1);
        
        return isSolidTile(leftTopTile) || isSolidTile(leftBottomTile);
    },
    
    // Проверка блокировки справа
    isBlockedRight: function(obj, newX) {
        // ПРОВЕРКА ГРАНИЦ: не выходим за правый край карты
        if (newX + obj.size_x > mapManager.mapSize.x) {
            return true;
        }
        
        // Проверяем правый верхний угол
        let rightTopTile = mapManager.getTilesetIdx(newX + obj.size_x - 1, obj.pos_y + 1);
        // Проверяем правый нижний угол
        let rightBottomTile = mapManager.getTilesetIdx(newX + obj.size_x - 1, obj.pos_y + obj.size_y - 1);
        
        return isSolidTile(rightTopTile) || isSolidTile(rightBottomTile);
    },
    
    isOnGround: function(obj){
        // Простая проверка - если под ногами земля
        let checkY = obj.pos_y + obj.size_y + 1;
        
        // Проверяем несколько точек под ногами
        let points = [
            obj.pos_x + 5,
            obj.pos_x + obj.size_x / 2,
            obj.pos_x + obj.size_x - 5
        ];
        
        for (let pointX of points) {
            let tileId = mapManager.getTilesetIdx(pointX, checkY);
            if (isSolidTile(tileId)) {
                return true;
            }
        }
        
        return false;
    },
    
    isHittingCeiling: function(obj){
        let checkY = obj.pos_y - 1;
        
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
    
    isUnderGround: function(obj){
        let checkY = obj.pos_y + obj.size_y;
        
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
        let attempts = 0;
        while (this.isUnderGround(obj) && attempts < 10) {
            obj.pos_y -= 2;
            attempts++;
        }
        
        if (this.isUnderGround(obj)) {
            let groundLevel = this.findGroundLevel(obj);
            if (groundLevel !== null) {
                obj.pos_y = groundLevel - obj.size_y;
            }
        }
    },
    
    findGroundLevel: function(obj){
        for (let y = obj.pos_y + obj.size_y; y >= 0; y--) {
            let leftTile = mapManager.getTilesetIdx(obj.pos_x + 8, y);
            let rightTile = mapManager.getTilesetIdx(obj.pos_x + obj.size_x - 8, y);
            
            if (!isSolidTile(leftTile) && !isSolidTile(rightTile)) {
                return y;
            }
        }
        return null;
    }
};
