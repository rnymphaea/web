import { mapManager } from "./map.js";
import { spriteManager } from "./spriteManager.js";
import { createSoldier } from "./objects.js";
import { eventsManager } from "./events.js";
import { gameManager } from "./game.js";
import { maps } from "./utils.js";

let canvas = document.getElementById('gameCanvas');
export let ctx = canvas.getContext('2d');
let game = gameManager;

export let gameStarted = false;
let points = 0;
let level = 1;

function preloadGame(mapPath) {
    mapManager.loadMap(mapPath, "mapSrc");
    spriteManager.loadAtlas("mapSrc/sprites.json", "mapSrc/spritesheet.png");
    eventsManager.setup();
}

function initializeGame() {
    mapManager.parseEntities();
    mapManager.draw(ctx);
    game.initPlayer(createSoldier(), 100, 100);
    game.gameCycle(level, points);
    gameStarted = true;

    game.waitForGameOver().then((data) => {
        if (data.win){
            if (level !== 2){
                level++;
                setTimeout(() => {
                    preloadGame(maps[level - 1]);
                    points = data.points;
                    mapManager.waitForLoad().then(() => {
                        initializeGame();
                    });
                }, 3000);
            }
            else{
                gameStarted = false;
                points = data.points;
                document.getElementById("gameStatus").innerHTML = "Вы победили";
                document.getElementById("gameStatus").style = "color: black";
                addRecord(points);
                points = 0;
                level = 1;
                preloadGame(maps[level - 1]);
            }
        }
        else{
            gameStarted = false;
            level = 1;
            points = 0;
            preloadGame(maps[level - 1]);
        }
    });
}

putRecords();
preloadGame(maps[level - 1]);

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("user").innerText = `Игрок ${localStorage.getItem("currentUser")}`;
    
    document.getElementById("startGame").addEventListener('click', () => {
        if (gameStarted){
            return;
        }
        mapManager.waitForLoad().then(() => {
            initializeGame();
        });
    });
    
    document.getElementById("endGame").addEventListener('click', () => {
        game.gameOver();
    });
});

function addRecord(score){
    const records = JSON.parse(localStorage.getItem('records'));
    console.log(records, localStorage.getItem('currentUser'));
    if (score > records[localStorage.getItem('currentUser')]){
        records[localStorage.getItem('currentUser')] = score;
    }
    
    localStorage.setItem('records', JSON.stringify(records));
    putRecords();
}


function putRecords(){
    const records = JSON.parse(localStorage.getItem('records'));
    const listElement = document.getElementById("listOfRecords");
    const sortedRecords = Object.fromEntries(Object.entries(records).sort((a, b) => b[1] - a[1]));
    listElement.innerHTML = '';
    for (let key in sortedRecords){
        if (sortedRecords[key] >= 0){
            listElement.innerHTML += `<li>${key}: ${sortedRecords[key]}</li>`;
        }
    }
}
