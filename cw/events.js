export let eventsManager = {
    bind: [],
    action: [],
    setup: function(){
        // Назначаем клавиши
        this.bind[39] = 'runRight'; // Стрелка вправо
        this.bind[37] = 'runLeft';  // Стрелка влево
        this.bind[38] = 'jump';     // Стрелка вверх (прыжок)
        this.bind[32] = 'jump';     // Пробел (прыжок)
        this.bind[65] = 'runLeft';  // A
        this.bind[68] = 'runRight'; // D
        this.bind[87] = 'jump';     // W (прыжок)
        
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    },
    onKeyDown: function(event){
        let action = eventsManager.bind[event.keyCode];
        if (action){
            eventsManager.action[action] = true;
        }
    },
    onKeyUp: function(event){
        let action = eventsManager.bind[event.keyCode];
        if (action){
            eventsManager.action[action] = false;
        }
    }
};
