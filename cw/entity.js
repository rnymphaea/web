import { spriteManager } from "./sprite.js"

export let Entity = {
    pos_x: 0, pos_y: 0,
    size_x: 32, size_y: 32,
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
    move_x: 0, move_y: 0,
    currentState: "idle_right",
    speed: 5,
    draw: function(ctx){
        spriteManager.drawSprite(ctx, this.currentState, this.pos_x, this.pos_y);
    },
    
    changeState: function(){
        if (this.move_x === 1){
            this.currentState = "run_right_1";
        }
        else if (this.move_x === -1){
            this.currentState = "run_left_1";
        }
        else{
            if (this.currentState === "run_left_1" || this.currentState === "run_left_2" || 
                this.currentState === "run_left_3" || this.currentState === "run_left_4" ||
                this.currentState === "idle_left"){
                this.currentState = "idle_left";
            }
            else{
                this.currentState = "idle_right";
            }
        }
    }
});

export function createPlayer(){
    return Entity.extend(Player);
}
