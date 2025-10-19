class Tetris {
    BOARD_WIDTH = 10;
    BOARD_HEIGHT = 20;
    CELL_SIZE = 30;

    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.canvas.width = this.BOARD_WIDTH * this.CELL_SIZE;
        this.canvas.height = this.BOARD_HEIGHT * this.CELL_SIZE;
        this.nextCanvas.width = 80;
        this.nextCanvas.height = 80;

        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;

        this.pieceX = 3;
        this.pieceY = 0;

        this.setupEventListeners();
        this.gameLoop();
    }

    pieces = [
        [
            [1, 1, 1, 1]
        ], // I
        [
            [1, 1],
            [1, 1]
        ], // O
        [
            [1, 1, 1],
            [0, 1, 0]
        ], // T
        [
            [1, 1, 1],
            [1, 0, 0]
        ], // L
        [
            [1, 1, 1],
            [0, 0, 1]
        ], // J
        [
            [0, 1, 1],
            [1, 1, 0]
        ], // S
        [
            [1, 1, 0],
            [0, 1, 1]
        ] // Z
    ];

    randomPiece() {
        const colors = [
        '#FF6B6B', // красный
        '#4ECDC4', // бирюзовый
        '#45B7D1', // синий
        '#96CEB4', // зелёный
        '#FFEAA7', // жёлтый
        '#DDA0DD', // фиолетовый
        '#FFA07A'  // оранжевый
    ];
    
    const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    const colorIndex = this.pieces.indexOf(piece);
    
    return {
        shape: piece,
        color: colors[colorIndex]
    };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        this.drawBoard();

        this.drawPiece(this.ctx, this.currentPiece, this.pieceX, this.pieceY);

        this.drawNextPiece();

        this.updateInfo();
    }

    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE - 1, this.CELL_SIZE - 1);
                }
            }
        }
    }

    drawPiece(ctx, piece, x, y) {
        ctx.fillStyle = piece.color;
        piece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    ctx.fillRect((x + dx) * this.CELL_SIZE, (y + dy) * this.CELL_SIZE, this.CELL_SIZE - 1, this.CELL_SIZE - 1);
                }
            });
        });
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = this.nextPiece.color;
        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.nextCtx.fillRect(x * 20, y * 20, 19, 19);
                }
            });
        });
    }

    movePiece(dx, dy) {
        if (!this.collision(this.pieceX + dx, this.pieceY + dy, this.currentPiece.shape)) {
            this.pieceX += dx;
            this.pieceY += dy;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );

        if (!this.collision(this.pieceX, this.pieceY, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }

    collision(x, y, shape) {
        for (let dy = 0; dy < shape.length; dy++) {
            for (let dx = 0; dx < shape[dy].length; dx++) {
                if (shape[dy][dx] &&
                    (x + dx < 0 || x + dx >= this.BOARD_WIDTH ||
                        y + dy >= this.BOARD_HEIGHT  ||
                        (y + dy >= 0 && this.board[y + dy][x + dx]))) {
                    return true;
                }
            }
        }
        return false;
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value && this.pieceY + y >= 0) {
                    this.board[this.pieceY + y][this.pieceX + x] = this.currentPiece.color;
                }
            });
        });

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.pieceX = 3;
        this.pieceY = 0;

        if (this.collision(this.pieceX, this.pieceY, this.currentPiece.shape)) {
            this.gameOver = true;
            this.showHighscores();
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
        }
    }

    drop() {
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }

    updateInfo() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('usernameDisplay').textContent =
            localStorage.getItem('tetris.username');
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.gameOver) return;

            switch (event.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.drop();
                    break;
            }
            this.draw();
        });
    }

    gameLoop() {
        if (!this.gameOver) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.draw();
            setTimeout(() => this.gameLoop(), 1000 / this.level);
        }
    }

    showHighscores() {
        const highscores = JSON.parse(localStorage.getItem('tetris.highscores') || '[]');
        const username = localStorage.getItem('tetris.username');

        highscores.push({
            name: username,
            score: this.score,
            date: new Date().toLocaleDateString()
        });

        highscores.sort((a, b) => b.score - a.score);

        localStorage.setItem('tetris.highscores', JSON.stringify(highscores.slice(0, 10)));

        this.displayHighscores(highscores);
    }

    displayHighscores(highscores) {
        const overlay = document.createElement('div');
        overlay.className = 'highscores-overlay';

        overlay.innerHTML = `
            <div class="highscores-container">
                <h2>Игра окончена!</h2>
                <h3>Ваш счёт: ${this.score}</h3>
            
                <h3>Таблица рекордов:</h3>
                <ol class="highscores-list">
                    ${highscores.slice(0, 10).map((score, index) => `
                        <li class="highscore-item">
                            <span class="highscore-name">${score.name}</span>
                            <span class="highscore-score">${score.score}</span>
                        </li>
                    `).join('')}
                </ol>
            
                <div class="button-group">
                    <button class="menu-button primary-button" onclick="location.reload()">
                        Играть снова
                    </button>
                    <button class="menu-button secondary-button" onclick="window.location='index.html'">
                        Новый игрок
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }
}

window.addEventListener('load', () => {
    new Tetris();
});
