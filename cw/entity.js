import { spriteManager } from "./sprite.js";

export let Entity = {
    pos_x: 0, 
    pos_y: 0,
    size_x: 32, 
    size_y: 32,
    velocityY: 0,
    extend: function(extendProto){
        let object = Object.create(this);
        for (let property in extendProto){
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined'){
                object[property] = extendProto[property];
            }
        }
        return object;
    }
};

export let Player = Entity.extend({
    move_x: 0,
    move_y: 0,
    currentState: "idle_right",
    speed: 5,
    isJumping: false,
    lastDirection: "right", // для запоминания направления
    
    // Таймеры для анимации
    animationTimer: 0,
    animationFrame: 0,
    runAnimationFrames: ["1", "2", "3", "4"], // Номера кадров для бега
    
    draw: function(ctx){
        spriteManager.drawSprite(ctx, this.currentState, this.pos_x, this.pos_y);
    },
    
    update: function(){
        // Обновляем анимацию
        this.updateAnimation();
        
        // Обновляем состояние
        this.changeState();
    },
    
    updateAnimation: function(){
        this.animationTimer++;
        
        // Анимация бега (смена кадров каждые 5 обновлений)
        if (this.move_x !== 0 && this.animationTimer % 5 === 0) {
            this.animationFrame = (this.animationFrame + 1) % this.runAnimationFrames.length;
        }
        
        // Сброс анимации при остановке
        if (this.move_x === 0) {
            this.animationFrame = 0;
        }
    },
    
    changeState: function(){
        // Запоминаем направление
        if (this.move_x > 0) {
            this.lastDirection = "right";
        } else if (this.move_x < 0) {
            this.lastDirection = "left";
        }
        
        // Обработка прыжка
        if (this.isJumping || this.velocityY < 0) {
            if (this.lastDirection === "right") {
                this.currentState = "run_right_3"; // Спрайт прыжка вправо
            } else {
                this.currentState = "run_left_3"; // Спрайт прыжка влево
            }
            return;
        }
        
        // Обработка бега
        if (this.move_x !== 0) {
            let frame = this.runAnimationFrames[this.animationFrame];
            if (this.move_x > 0) {
                this.currentState = "run_right_" + frame;
            } else {
                this.currentState = "run_left_" + frame;
            }
        } 
        // Обработка покоя
        else {
            if (this.lastDirection === "right") {
                this.currentState = "idle_right";
            } else {
                this.currentState = "idle_left";
            }
        }
    }
});

export function createPlayer(){
    let player = Entity.extend(Player);
    return player;
}
