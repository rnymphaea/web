export let eventsManager = {
    bind: [],
    action: [],
    
    setup: function(){
        this.bind[39] = 'runRight';
        this.bind[37] = 'runLeft';
        this.bind[38] = 'jump';
        this.bind[32] = 'jump';
        this.bind[65] = 'runLeft';
        this.bind[68] = 'runRight';
        this.bind[87] = 'jump';
        
        // Левая кнопка мыши
        this.bind[0] = 'attack';
        
        this.bind[16] = 'dash';
        
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
        
        document.addEventListener("mousedown", this.onMouseDown);
        document.addEventListener("mouseup", this.onMouseUp);
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
    },
    
    onMouseDown: function(event){
        let action = eventsManager.bind[event.button];
        if (action){
            eventsManager.action[action] = true;
        }
    },
    
    onMouseUp: function(event){
        let action = eventsManager.bind[event.button];
        if (action){
            eventsManager.action[action] = false;
        }
    }
};
