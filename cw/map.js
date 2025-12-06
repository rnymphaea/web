export let mapManager = {
    mapData: null,
    tLayer: null,
    xCount: 0,
    yCount: 0,
    tSize: {x: 32, y: 32},
    mapSize: {x: 32, y: 32},
    tilesets: new Array(),
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,
    directory: "",
    view: {x: 0, y: 0, w: 1200, h: 800},

    loadMap: function(path, dir){
        this.directory = dir;
        let request = new XMLHttpRequest();
        request.onreadystatechange = function (){
            if (request.readyState === 4 && request.status === 200){
                mapManager.parseMap(request.responseText);
            }
        };
        request.open("GET", dir + "/" + path, true);
        request.send();
    },

    parseMap: function(tilesJSON){
        try {
            this.mapData = JSON.parse(tilesJSON);
            this.xCount = this.mapData.width;
            this.yCount = this.mapData.height;
            this.tSize.x = this.mapData.tilewidth;
            this.tSize.y = this.mapData.tileheight;
            this.mapSize.x = this.xCount * this.tSize.x;
            this.mapSize.y = this.yCount * this.tSize.y;

            // Инициализируем tLayer сразу при парсинге
            for (let i = 0; i < this.mapData.layers.length; i++){
                let layer = this.mapData.layers[i];
                if (layer.type === "tilelayer"){
                    this.tLayer = layer;
                    break;
                }
            }

            for (let i = 0; i < this.mapData.tilesets.length; i++){
                let tileset = this.mapData.tilesets[i];
                this.loadTileset(tileset);
            }
            this.jsonLoaded = true;
        } catch (error) {
            console.error('Ошибка парсинга карты:', error);
        }
    },

    loadTileset: function(tileset){
        let tsjRequest = new XMLHttpRequest();
        tsjRequest.onreadystatechange = function (){
            if (tsjRequest.readyState === 4 && tsjRequest.status === 200){
                mapManager.parseTileset(tsjRequest.responseText, tileset);
            }
        };
        tsjRequest.open("GET", this.directory + "/" + tileset.source, true);
        tsjRequest.send();
    },

    parseTileset: function(tsjJSON, tileset){
        let tsjData = JSON.parse(tsjJSON);
        
        let tilesetObj = {
            firstgid: tileset.firstgid,
            image: new Image(),
            imageUrl: tsjData.image,
            name: tsjData.name,
            xCount: Math.floor(tsjData.imagewidth / this.tSize.x),
            yCount: Math.floor(tsjData.imageheight / this.tSize.y),
        };

        tilesetObj.image.onload = function(){
            mapManager.imgLoadCount++;
            if (mapManager.imgLoadCount === mapManager.mapData.tilesets.length){
                mapManager.imgLoaded = true;
                console.log('Все изображения карты загружены');
            }
        };
        
        tilesetObj.image.onerror = function() {
            console.error('Ошибка загрузки изображения tileset:', tsjData.image);
        };
        
        tilesetObj.image.src = this.directory + "/" + tsjData.image;
        this.tilesets.push(tilesetObj);
    },

    draw: function(ctx){
        if (!this.imgLoaded || !this.jsonLoaded || !this.tLayer){
            // Показываем сообщение о загрузке
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText('Загрузка карты...', 50, 50);
            setTimeout(function(){ this.draw(ctx); }.bind(this), 100);
            return;
        }
        
        for (let i = 0; i < this.tLayer.data.length; i++){
            let tile = this.getTile(this.tLayer.data[i]);
            if (!tile || !tile.img) continue;
            
            let pX = (i % this.xCount) * this.tSize.x;
            let pY = Math.floor(i / this.xCount) * this.tSize.y;

            // Проверяем видимость тайла
            if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
                continue;
            }

            pX -= this.view.x;
            pY -= this.view.y;

            ctx.drawImage(tile.img, tile.px, tile.py, this.tSize.x,
                this.tSize.y, pX, pY, this.tSize.x, this.tSize.y);
        }            
    },

    getTile: function(tileIndex){
        if (tileIndex === 0) return null;
        
        let tile = {
            img: null,
            px: 0,
            py: 0
        }

        let tileset = this.getTileset(tileIndex);
        if (!tileset || !tileset.image) return null;
        
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;

        let x = id % tileset.xCount;
        let y = Math.floor(id / tileset.xCount);

        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;

        return tile;
    },

    getTileset: function(tileIndex){
        for (let i = this.tilesets.length - 1; i >= 0; i--){
            if (this.tilesets[i].firstgid <= tileIndex){
                return this.tilesets[i];
            }
        }
        return null;
    },

    isVisible: function(x, y, width, height){
        if (x + width < this.view.x || y + height < this.view.y ||
            x > this.view.x + this.view.w || y > this.view.y + this.view.h){
                return false;
        }
        return true;
    },

    getTilesetIdx: function(x, y){
        // Защитная проверка как в учебнике
        if (!this.tLayer || !this.tLayer.data) {
            return 0; // Возвращаем значение по умолчанию
        }
        
        let wX = x;
        let wY = y;
        
        // Проверяем границы карты
        if (wX < 0 || wY < 0 || 
            wX >= this.mapSize.x || wY >= this.mapSize.y) {
            return 0; // Возвращаем значение по умолчанию
        }
        
        let idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        
        // Проверяем границы массива
        if (idx < 0 || idx >= this.tLayer.data.length) {
            return 0;
        }
        
        return this.tLayer.data[idx];
    },

    centerAt: function (x, y) {
        if (x < this.view.w / 2){
            this.view.x = 0;
        }
        else{
            if (x > this.mapSize.x - this.view.w / 2){
                this.view.x = this.mapSize.x - this.view.w;
            }
            else{
                this.view.x = x - (this.view.w / 2);
            }
        }
        if (y < this.view.h / 2){
            this.view.y = 0;
        }
        else{
            if (y > this.mapSize.y - this.view.h / 2){
                this.view.y = this.mapSize.y - this.view.h;
            }
            else{
                this.view.y = y - (this.view.h / 2);
            }
        }
    },

    clearMap: function(){
        this.mapData = null;
        this.tLayer = null;
        this.xCount = 0;
        this.yCount = 0;
        this.tSize = {x: 32, y: 32};
        this.mapSize = {x: 32, y: 32};
        this.tilesets = new Array();
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.jsonLoaded = false;
        this.directory = "";
        this.view = {x: 0, y: 0, w: 1200, h: 800};
    }
};
