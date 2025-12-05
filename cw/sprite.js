import { mapManager } from "./map.js";

export let spriteManager = {
    image: new Image(),
    sprites: new Array(),
    imgLoaded: false,
    jsonLoaded: false,

    loadAtlas: function(atlasJson, atlasImg){
        let request = new XMLHttpRequest();
        request.onreadystatechange = function(){
            if (request.readyState === 4 && request.status === 200){
                spriteManager.parseAtlas(request.responseText);
            }
        };
        request.open("GET", atlasJson, true);
        request.send();
        this.loadImg(atlasImg);
    },

    loadImg: function(imgName){
        this.image.onload = function(){
            spriteManager.imgLoaded = true;
            console.log('Изображение спрайтов загружено:', imgName);
        };
        this.image.onerror = function() {
            console.error('Ошибка загрузки изображения спрайтов:', imgName);
        };
        this.image.src = imgName;
    },

    parseAtlas: function(atlasJSON){
        try {
            let spritesArray = JSON.parse(atlasJSON);
            
            this.sprites = spritesArray.map(sprite => ({
                name: sprite.name,
                x: sprite.x,
                y: sprite.y,
                w: sprite.width,
                h: sprite.height
            }));
            
            this.jsonLoaded = true;
            console.log('Загружено спрайтов:', this.sprites.length);
            
            console.log('Доступные спрайты:');
            this.sprites.forEach(s => {
                console.log('  -', s.name);
            });
            
        } catch (error) {
            console.error('Ошибка парсинга JSON спрайтов:', error);
        }
    },

    drawSprite: function(ctx, name, x, y){
        if (!this.imgLoaded || !this.jsonLoaded){
            console.log('Ожидание загрузки спрайтов...');
            setTimeout(() => {
                this.drawSprite(ctx, name, x, y);
            }, 100);
            return;
        }
        
        let sprite = this.getSprite(name);
        if (!sprite) {
            console.warn('Спрайт не найден:', name);
            console.log('Доступные спрайты:', this.sprites.map(s => s.name).join(', '));
            
            ctx.fillStyle = 'red';
            ctx.fillRect(x - mapManager.view.x, y - mapManager.view.y, 32, 32);
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(name, x - mapManager.view.x + 2, y - mapManager.view.y + 10);
            return;
        }
        
        if (!mapManager.isVisible(x, y, sprite.w, sprite.h)){
            return;
        }
        
        x -= mapManager.view.x;
        y -= mapManager.view.y;
        
        ctx.drawImage(this.image, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
    },

    getSprite: function(name){
        for (let i = 0; i < this.sprites.length; i++){
            let s = this.sprites[i];
            if (s.name === name){
                return s;
            }
        }
        return null;
    }
};
