(() => {
  const COLS = 10, ROWS = 20;
  const CELL = 30;
  const START_SPEED = 800;
  const LEVEL_STEP = 1;
  const LINES_PER_LEVEL = 10;
  const USER_KEY = "tetris.username";
  const HS_KEY = "tetris.highscores";

  const canvas = document.getElementById("playfield");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d");
  const nextDiv = document.getElementById("nextPiece");
  nextDiv.innerHTML = "<canvas id='nextCanvas' width='120' height='120'></canvas>";
  const nextCanvas = document.getElementById("nextCanvas");
  const nCtx = nextCanvas.getContext("2d");

  const playerNameEl = document.getElementById("playerName");
  const scoreEl = document.getElementById("score");
  const levelEl = document.getElementById("level");
  const gameOverOverlay = document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");

  document.getElementById("btnPause").addEventListener("click", togglePause);
  document.getElementById("btnRestart").addEventListener("click", restart);
  document.getElementById("btnScores").addEventListener("click", ()=>location.href="scores.html");
  document.getElementById("saveScore").addEventListener("click", saveScore);
  document.getElementById("backToLogin").addEventListener("click", ()=>location.href="index.html");
  document.getElementById("playAgain").addEventListener("click", ()=>{ restart(); hideGameOver(); });

  const playerName = localStorage.getItem(USER_KEY) || "Игрок";
  playerNameEl.textContent = playerName;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq=440, dur=0.06, type='sine', gain=0.06){
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  }

  const TETROMINO = {
    I: { color:'#00f0f0', blocks: [[0,1],[1,1],[2,1],[3,1]] },
    J: { color:'#0000f0', blocks: [[0,0],[0,1],[1,1],[2,1]] },
    L: { color:'#f0a000', blocks: [[2,0],[0,1],[1,1],[2,1]] },
    O: { color:'#f0f000', blocks: [[1,0],[2,0],[1,1],[2,1]] },
    S: { color:'#00f000', blocks: [[1,0],[2,0],[0,1],[1,1]] },
    T: { color:'#a000f0', blocks: [[1,0],[0,1],[1,1],[2,1]] },
    Z: { color:'#f00000', blocks: [[0,0],[1,0],[1,1],[2,1]] },
  };
  const NAMES = Object.keys(TETROMINO);

  function createEmpty() {
    return Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
  }

  function bagGenerator(){
    let bag = [];
    return function nextFromBag(){
      if(bag.length===0){
        bag = shuffle(NAMES.slice());
      }
      return bag.pop();
    };
  }
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  const nextNameGen = bagGenerator();

  let grid = createEmpty();
  let current = null;
  let next = null;
  let dropTimer = null;
  let speed = START_SPEED;
  let score = 0;
  let level = 1;
  let linesCleared = 0;
  let paused = false;
  let running = false;

  function makePiece(name){
    const def = TETROMINO[name];
    return {
      name,
      color: def.color,
      coords: def.blocks.map(([x,y])=>[x,y]),
      x: Math.floor((COLS - 4) / 2),
      y: -1, 
      rotation: 0
    };
  }

  function rotateCoords(coords){
    return coords.map(([x,y])=>[y, -x]);
  }

  function getCells(piece){
    return piece.coords.map(([bx,by])=>[piece.x + bx, piece.y + by]);
  }

  function collides(piece, gx = grid){
    for(const [cx,cy] of getCells(piece)){
      if(cx < 0 || cx >= COLS) return true;
      if(cy >= ROWS) return true;
      if(cy >= 0 && gx[cy][cx]) return true;
    }
    return false;
  }

  function lockPiece(piece){
    for(const [cx,cy] of getCells(piece)){
      if(cy>=0 && cy<ROWS && cx>=0 && cx<COLS){
        grid[cy][cx] = { color: piece.color };
      } else if (cy < 0) {
        endGame();
      }
    }
  }

  function clearLines(){
    let removed = 0;
    for(let r=ROWS-1;r>=0;){
      if(grid[r].every(cell => cell !== null)){
        grid.splice(r,1);
        grid.unshift(Array(COLS).fill(null));
        removed++;
      } else r--;
    }
    if(removed>0){
      linesCleared += removed;
      const points = [0,100,300,500,800][removed] || (removed*300);
      score += points * level;
      const newLevel = Math.floor(linesCleared / LINES_PER_LEVEL) + 1;
      if(newLevel > level){
        level = newLevel;
        speed = Math.max(80, START_SPEED - (level-1)*70);
        beep(880, 0.08, 'square', 0.08);
      } else {
        beep(720, 0.06, 'sine', 0.05);
      }
      updateUI();
    }
  }

  function spawn(){
    current = next || makePiece(nextNameGen());
    next = makePiece(nextNameGen());
    current.x = Math.floor((COLS - 4) / 2);
    current.y = -2;
    if(collides(current)) endGame();
    drawNext();
  }

  function stepDown() {
    if(!current) return;
    current.y += 1;
    if(collides(current)){
      current.y -= 1;
      lockPiece(current);
      clearLines();
      spawn();
    }
    draw();
  }

  function hardDrop() {
    if(!current) return;
    while(!collides(current)){
      current.y += 1;
    }
    current.y -= 1;
    lockPiece(current);
    clearLines();
    score += 2 * level;
    spawn();
    updateUI();
    beep(1000,0.03,'sine',0.06);
    draw();
  }

  function move(deltaX) {
    if(!current) return;
    current.x += deltaX;
    if(collides(current)) current.x -= deltaX;
    draw();
  }

  function rotatePiece() {
    if(!current) return;
    const cx = current.coords.map(c => c.slice());
    const rotated = rotateCoords(cx);
    const oldCoords = current.coords;
    current.coords = rotated;
    const kicks = [[0,0],[-1,0],[1,0],[0,-1],[0,1],[-2,0],[2,0]];
    let ok = false;
    for(const [kx,ky] of kicks){
      current.x += kx;
      current.y += ky;
      if(!collides(current)){ ok = true; break; }
      current.x -= kx;
      current.y -= ky;
    }
    if(!ok) current.coords = oldCoords;
    draw();
  }

  function drawCell(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.strokeRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
  }

  function draw() {
    ctx.fillStyle = "#041022";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        if(grid[r][c]){
          drawCell(c,r,grid[r][c].color);
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.02)";
          ctx.strokeRect(c*CELL, r*CELL, CELL, CELL);
        }
      }
    }

    if(current){
      for(const [cx,cy] of getCells(current)){
        if(cy >= 0) drawCell(cx, cy, current.color);
      }
    }
  }

  function drawNext(){
    nCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
    nCtx.fillStyle = "#05121a";
    nCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
    if(!next) return;
    const box = 4;
    const scale = 20;
    const offsetX = (nextCanvas.width - box*scale)/2;
    const offsetY = (nextCanvas.height - box*scale)/2;
    for(const [bx,by] of next.coords){
      nCtx.fillStyle = next.color;
      nCtx.fillRect(offsetX + bx*scale + 2, offsetY + by*scale + 2, scale-4, scale-4);
    }
  }

  function updateUI(){
    scoreEl.textContent = score;
    levelEl.textContent = level;
  }

  function start(){
    if(running) return;
    running = true;
    paused = false;
    grid = createEmpty();
    score = 0; level = 1; linesCleared = 0;
    speed = START_SPEED;
    next = makePiece(nextNameGen());
    spawn();
    scheduleDrop();
    updateUI();
    draw();
  }

  function scheduleDrop(){
    if(dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(() => {
      if(!paused) stepDown();
    }, speed);
  }

  function togglePause(){
    paused = !paused;
    document.getElementById("btnPause").textContent = paused ? "Продолжить" : "Пауза";
  }

  function restart(){
    running = false;
    if(dropTimer) clearInterval(dropTimer);
    grid = createEmpty();
    next = null;
    current = null;
    score = 0; level = 1; linesCleared = 0;
    start();
  }

  function endGame(){
    running = false;
    if(dropTimer) clearInterval(dropTimer);
    finalScoreEl.textContent = score;
    showGameOver();
    beep(140,0.25,'sine',0.15);
  }

  function showGameOver(){
    gameOverOverlay.classList.remove("hidden");
  }
  function hideGameOver(){ gameOverOverlay.classList.add("hidden"); }

  function saveScore(){
    const name = localStorage.getItem(USER_KEY) || "Игрок";
    const raw = localStorage.getItem(HS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ name, score, date: (new Date()).toLocaleString() });
    arr.sort((a,b)=>b.score - a.score);
    const top = arr.slice(0,10);
    localStorage.setItem(HS_KEY, JSON.stringify(top));
    alert("Сохранено!");
  }

  document.addEventListener("keydown", (e) => {
    if(!running) start();
    if(e.key === "ArrowLeft") { move(-1); e.preventDefault(); }
    else if(e.key === "ArrowRight") { move(1); e.preventDefault(); }
    else if(e.key === "ArrowDown") { // soft drop
      stepDown(); e.preventDefault(); score += 0; updateUI(); beep(600,0.02,'sine',0.01);
    }
    else if(e.key === "ArrowUp") { rotatePiece(); e.preventDefault(); }
    else if(e.code === "Space") { hardDrop(); e.preventDefault(); }
  });

  start();

  function resizeCanvasForHiDPI() {
    const dpr = window.devicePixelRatio || 1;
    if(dpr === 1) return;
    const w = canvas.width, h = canvas.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

})();

