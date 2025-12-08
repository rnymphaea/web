import { spriteManager } from "./sprite.js";
import { ATTACK_COOLDOWN, ENEMY_TYPES, DASH_SPEED, DASH_DURATION, FIRE_FALL_SPEED, FIRE_TYPE, isSolidTile } from "./utils.js";
import { mapManager } from "./map.js";
import { soundManager } from "./sound.js";

export let Entity = {
    pos_x: 0, 
    pos_y: 0,
    size_x: 32, 
    size_y: 32,
    velocityY: 0,
    isAlive: true,
    lastAttackTime: 0,
    
    extend: function(extendProto){
        let object = Object.create(this);
        for (let property in extendProto){
            object[property] = extendProto[property];
        }
        return object;
    },
    
    canAttack: function() {
        return Date.now() - this.lastAttackTime > ATTACK_COOLDOWN;
    },
    
    attack: function() {
        if (this.canAttack()) {
            this.lastAttackTime = Date.now();
            return true;
        }
        return false;
    }
};

export let Player = Entity.extend({
    move_x: 0,
    move_y: 0,
    currentState: "idle_right",
    speed: 5,
    isJumping: false,
    isAttacking: false,
    lastDirection: "right",
    attackTimer: 0,
    animationTimer: 0,
    animationFrame: 0,
    runAnimationFrames: ["1", "2", "3", "4"],
    
    dashCharges: 0,
    isDashing: false,
    dashTimer: 0,
    dashDirection: 0,
    
    draw: function(ctx){
        spriteManager.drawSprite(ctx, this.currentState, this.pos_x, this.pos_y);
    },
    
    update: function(){
        if (this.isAttacking) {
            this.attackTimer++;
            if (this.attackTimer > 10) {
                this.isAttacking = false;
                this.attackTimer = 0;
            }
        }
        
        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.dashTimer = 0;
            }
        }
        
        this.updateAnimation();
        this.changeState();
    },
    
    updateAnimation: function(){
        this.animationTimer++;
        
        if (this.move_x !== 0 && this.animationTimer % 5 === 0 && !this.isAttacking && !this.isDashing) {
            this.animationFrame = (this.animationFrame + 1) % this.runAnimationFrames.length;
        }
        
        if (this.move_x === 0 && !this.isAttacking && !this.isDashing) {
            this.animationFrame = 0;
        }
    },
    
    changeState: function(){
        if (this.isAttacking) {
            let attackFrame = this.attackTimer < 5 ? "1" : "2";
            if (this.lastDirection === "right") {
                this.currentState = "attack_right_" + attackFrame;
            } else {
                this.currentState = "attack_left_" + attackFrame;
            }
            return;
        }
        
        if (this.isDashing) {
            if (this.dashDirection === 1) {
                this.currentState = "run_right_2";
            } else {
                this.currentState = "run_left_2";
            }
            return;
        }
        
        if (this.move_x > 0) {
            this.lastDirection = "right";
        } else if (this.move_x < 0) {
            this.lastDirection = "left";
        }
        
        if (this.isJumping || this.velocityY < 0) {
            if (this.lastDirection === "right") {
                this.currentState = "run_right_3";
            } else {
                this.currentState = "run_left_3";
            }
            return;
        }
        
        if (this.move_x !== 0) {
            let frame = this.runAnimationFrames[this.animationFrame];
            if (this.move_x > 0) {
                this.currentState = "run_right_" + frame;
            } else {
                this.currentState = "run_left_" + frame;
            }
        } else {
            if (this.lastDirection === "right") {
                this.currentState = "idle_right";
            } else {
                this.currentState = "idle_left";
            }
        }
    },
    
    startAttack: function() {
        if (!this.isAttacking && this.attack()) {
            this.isAttacking = true;
            this.attackTimer = 0;
            soundManager.play("sound/attack.mp3", { volume: 0.6 });
            return true;
        }
        return false;
    },
    
    startDash: function() {
        if (this.dashCharges > 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = DASH_DURATION;
            this.dashDirection = this.lastDirection === "right" ? 1 : -1;
            this.dashCharges--;
            return true;
        }
        return false;
    },
    
    addDashCharge: function() {
        this.dashCharges++;
    },
    
    getAttackRange: function() {
        const attackRange = 50;
        const attackHeight = this.size_y;
        
        if (this.lastDirection === "right") {
            return {
                x: this.pos_x + this.size_x,
                y: this.pos_y,
                width: attackRange,
                height: attackHeight
            };
        } else {
            return {
                x: this.pos_x - attackRange,
                y: this.pos_y,
                width: attackRange,
                height: attackHeight
            };
        }
    },
    
    isCollidingWith: function(enemy) {
        return (
            this.pos_x < enemy.pos_x + enemy.size_x &&
            this.pos_x + this.size_x > enemy.pos_x &&
            this.pos_y < enemy.pos_y + enemy.size_y &&
            this.pos_y + this.size_y > enemy.pos_y
        );
    },
    
    isAttackingEnemy: function(enemy) {
        if (!this.isAttacking) return false;
        
        const attackRange = this.getAttackRange();
        return (
            attackRange.x < enemy.pos_x + enemy.size_x &&
            attackRange.x + attackRange.width > enemy.pos_x &&
            attackRange.y < enemy.pos_y + enemy.size_y &&
            attackRange.y + attackRange.height > enemy.pos_y
        );
    }
});

export function createPlayer(){
    let player = Entity.extend(Player);
    return player;
}

export let Enemy = Entity.extend({
    move_x: 0,
    move_y: 0,
    speed: 2,
    detectionRadius: 300,
    lastDirection: "left",
    
    draw: function(ctx){
        if (this.isAlive) {
            spriteManager.drawSprite(ctx, this.currentState, this.pos_x, this.pos_y);
        }
    },
    
    update: function(player){
        if (!this.isAlive || !player || !player.isAlive) return;
        
        let distance = Math.sqrt(
            Math.pow(this.pos_x - player.pos_x, 2) + 
            Math.pow(this.pos_y - player.pos_y, 2)
        );
        
        if (distance < this.detectionRadius) {
            if (player.pos_x > this.pos_x) {
                this.move_x = 1;
                this.lastDirection = "right";
            } else {
                this.move_x = -1;
                this.lastDirection = "left";
            }
        } else {
            this.move_x = 0;
        }
        
        if (this.move_x !== 0) {
            let newX = this.pos_x + (this.move_x * this.speed);
            
            if (mapManager.tLayers && mapManager.tLayers.length > 0) {
                let checkX = this.move_x > 0 ? newX + this.size_x : newX;
                let checkY = this.pos_y + this.size_y - 5;
                let tileId = mapManager.getTilesetIdx(checkX, checkY);
                if (!isSolidTile(tileId)) {
                    this.pos_x = newX;
                }
            }
        }
    }
});

export function createEnemy(type = 0){
    let enemy = Entity.extend(Enemy);
    enemy.currentState = ENEMY_TYPES[type] || "enemy_1";
    enemy.speed = 1 + Math.random() * 1;
    enemy.detectionRadius = 250 + Math.random() * 100;
    return enemy;
}

export let Fire = Entity.extend({
    fallSpeed: 6,
    isActive: true,
    spawnTime: 0,
    
    draw: function(ctx){
        if (this.isActive) {
            spriteManager.drawSprite(ctx, FIRE_TYPE, this.pos_x, this.pos_y);
        }
    },
    
    update: function(){
        if (!this.isActive) return;
        
        this.pos_y += this.fallSpeed;
        
        if (this.pos_y > mapManager.mapSize.y + 100) {
            this.isActive = false;
        }
    },
    
    isCollidingWithPlayer: function(player) {
        if (!this.isActive || !player || !player.isAlive) return false;
        
        return (
            this.pos_x < player.pos_x + player.size_x &&
            this.pos_x + this.size_x > player.pos_x &&
            this.pos_y < player.pos_y + player.size_y &&
            this.pos_y + this.size_y > player.pos_y
        );
    }
});

export function createFire(x, y){
    let fire = Entity.extend(Fire);
    fire.pos_x = x;
    fire.pos_y = y;
    fire.size_x = 32;
    fire.size_y = 32;
    fire.isActive = true;
    fire.spawnTime = Date.now();
    fire.fallSpeed = FIRE_FALL_SPEED + Math.random() * 2 - 1;
    return fire;
}
