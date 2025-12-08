import { mapManager } from "./map.js";
import { isSolidTile, DASH_SPEED, DASH_DURATION } from "./utils.js";

export let physicManager = {
    gravity: 0.8,
    jumpPower: 16,
    maxFallSpeed: 20,
    
    update: function(obj){
        if (!mapManager.jsonLoaded || !mapManager.imgLoaded || !mapManager.tLayers || mapManager.tLayers.length === 0) {
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
        } else if (obj.move_x !== 0) {
            let newX = obj.pos_x + (obj.move_x * obj.speed);
            
            if (newX < 0) {
                newX = 0;
            }
            
            if (obj.move_x < 0) {
                if (!this.isBlockedLeft(obj, newX) && newX >= 0) {
                    obj.pos_x = newX;
                }
            } else if (obj.move_x > 0) {
                if (!this.isBlockedRight(obj, newX)) {
                    obj.pos_x = newX;
                }
            }
        }
    },
    
    updateDash: function(obj) {
        obj.dashTimer--;
        
        const dashDirection = obj.dashDirection || (obj.lastDirection === "right" ? 1 : -1);
        const dashSpeed = DASH_SPEED;
        
        let newX = obj.pos_x + (dashDirection * dashSpeed);
        
        if (newX < 0) {
            newX = 0;
            obj.isDashing = false;
            obj.dashTimer = 0;
            return;
        }
        
        if (dashDirection > 0) {
            if (!this.isBlockedRight(obj, newX)) {
                obj.pos_x = newX;
            } else {
                obj.isDashing = false;
                obj.dashTimer = 0;
            }
        } else {
            if (!this.isBlockedLeft(obj, newX) && newX >= 0) {
                obj.pos_x = newX;
            } else {
                obj.isDashing = false;
                obj.dashTimer = 0;
            }
        }
        
        if (obj.dashTimer <= 0) {
            obj.isDashing = false;
            obj.dashTimer = 0;
        }
        
        let onGround = this.isOnGround(obj);
        
        if (!onGround) {
            obj.velocityY += this.gravity;
            if (obj.velocityY > this.maxFallSpeed) {
                obj.velocityY = this.maxFallSpeed;
            }
            obj.pos_y += obj.velocityY;
            
            if (this.isUnderGround(obj)) {
                this.alignToGround(obj);
                obj.velocityY = 0;
            }
        } else {
            obj.velocityY = 0;
        }
    },
    
    isBlockedLeft: function(obj, newX) {
        if (newX < 0) return true;
        
        let leftTopTile = mapManager.getTilesetIdx(newX + 1, obj.pos_y + 1);
        let leftBottomTile = mapManager.getTilesetIdx(newX + 1, obj.pos_y + obj.size_y - 1);
        
        return isSolidTile(leftTopTile) || isSolidTile(leftBottomTile);
    },
    
    isBlockedRight: function(obj, newX) {
        if (newX + obj.size_x > mapManager.mapSize.x) return true;
        
        let rightTopTile = mapManager.getTilesetIdx(newX + obj.size_x - 1, obj.pos_y + 1);
        let rightBottomTile = mapManager.getTilesetIdx(newX + obj.size_x - 1, obj.pos_y + obj.size_y - 1);
        
        return isSolidTile(rightTopTile) || isSolidTile(rightBottomTile);
    },
    
    isOnGround: function(obj){
        let checkY = obj.pos_y + obj.size_y + 1;
        
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
