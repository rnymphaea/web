import { spriteManager } from "./sprite.js";
import { ATTACK_COOLDOWN, ENEMY_TYPES } from "./utils.js";

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
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined'){
                object[property] = extendProto[property];
            }
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
    
    draw: function(ctx){
        spriteManager.drawSprite(ctx, this.currentState, this.pos_x, this.pos_y);
    },
    
    update: function(){
        // Обновляем таймер атаки
        if (this.isAttacking) {
            this.attackTimer++;
            if (this.attackTimer > 10) {
                this.isAttacking = false;
                this.attackTimer = 0;
            }
        }
        
        this.updateAnimation();
        this.changeState();
    },
    
    updateAnimation: function(){
        this.animationTimer++;
        
        if (this.move_x !== 0 && this.animationTimer % 5 === 0 && !this.isAttacking) {
            this.animationFrame = (this.animationFrame + 1) % this.runAnimationFrames.length;
        }
        
        if (this.move_x === 0 && !this.isAttacking) {
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
            return true;
        }
        return false;
    },
    
    // Зона атаки (справа или слева от игрока)
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
    
    // Проверка столкновения с врагом
    isCollidingWith: function(enemy) {
        return (
            this.pos_x < enemy.pos_x + enemy.size_x &&
            this.pos_x + this.size_x > enemy.pos_x &&
            this.pos_y < enemy.pos_y + enemy.size_y &&
            this.pos_y + this.size_y > enemy.pos_y
        );
    },
    
    // Проверка попадания атаки по врагу
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
        
        // Если игрок в зоне обнаружения
        if (distance < this.detectionRadius) {
            // Определяем направление к игроку
            if (player.pos_x > this.pos_x) {
                this.move_x = 1;
                this.lastDirection = "right";
            } else {
                this.move_x = -1;
                this.lastDirection = "left";
            }
            
            // Обновляем спрайт в зависимости от направления
            if (this.move_x > 0) {
                // Для врага 1 и 2 используем соответствующие спрайты для движения вправо
                if (this.currentState === "enemy_1" || this.currentState === "enemy_2") {
                    this.currentState = this.currentState;
                }
            } else {
                // Для движения влево можно использовать те же спрайты или другие
                if (this.currentState === "enemy_1" || this.currentState === "enemy_2") {
                    this.currentState = this.currentState;
                }
            }
        } else {
            this.move_x = 0;
        }
        
        // Движение врага
        if (this.move_x !== 0) {
            this.pos_x += this.move_x * this.speed;
        }
    }
});

export function createEnemy(type = 0){
    let enemy = Entity.extend(Enemy);
    enemy.currentState = ENEMY_TYPES[type] || "enemy_1";
    enemy.speed = 1.5 + Math.random() * 1; // Скорость 1.5-2.5
    enemy.detectionRadius = 250 + Math.random() * 100; // Радиус 250-350
    return enemy;
}
