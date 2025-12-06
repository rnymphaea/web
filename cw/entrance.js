// entrance.js
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем имя игрока из localStorage
    const playerNameInput = document.getElementById('playerName');
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        playerNameInput.value = savedName;
    }
    
    // Сохраняем имя при изменении
    playerNameInput.addEventListener('input', function() {
        localStorage.setItem('playerName', this.value.trim());
    });
    
    // Обработчики меню
    document.getElementById('startGame').addEventListener('click', function() {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            localStorage.setItem('playerName', playerName);
        }
        window.location.href = 'index.html';
    });
    
    document.getElementById('viewRecords').addEventListener('click', function() {
        showRecordsTable();
    });
    
    document.getElementById('howToPlay').addEventListener('click', function() {
        showHowToPlay();
    });
    
    // Добавляем обработчик для закрытия модальных окон
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal-close')) {
            closeModal();
        }
        // Закрытие по клику вне модального окна
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
});

function showRecordsTable() {
    const records = JSON.parse(localStorage.getItem('gameRecords') || '[]');
    
    // Фильтруем только тех, кто прошел уровень (прогресс = 100%)
    const completedGames = records.filter(record => record.progress === 100);
    
    let html = '<div class="modal"><div class="modal-content">';
    html += '<h3>Таблица рекордов</h3>';
    
    if (completedGames.length === 0) {
        html += '<p>Пока нет завершенных уровней</p>';
    } else {
        // Группируем по уровням и сортируем по времени
        const level1Records = completedGames.filter(r => r.level === 1).sort((a, b) => a.time - b.time);
        const level2Records = completedGames.filter(r => r.level === 2).sort((a, b) => a.time - b.time);
        
        html += '<h4>Уровень 1</h4>';
        if (level1Records.length === 0) {
            html += '<p>Нет завершенных попыток</p>';
        } else {
            html += '<table class="records-table">';
            html += '<tr><th>Место</th><th>Имя</th><th>Время</th></tr>';
            
            level1Records.slice(0, 10).forEach((record, index) => {
                const minutes = Math.floor(record.time / 60);
                const seconds = record.time % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                html += `<tr>
                    <td>${index + 1}</td>
                    <td>${record.name}</td>
                    <td>${timeStr}</td>
                </tr>`;
            });
            
            html += '</table>';
        }
        
        html += '<h4>Уровень 2</h4>';
        if (level2Records.length === 0) {
            html += '<p>Нет завершенных попыток</p>';
        } else {
            html += '<table class="records-table">';
            html += '<tr><th>Место</th><th>Имя</th><th>Время</th></tr>';
            
            level2Records.slice(0, 10).forEach((record, index) => {
                const minutes = Math.floor(record.time / 60);
                const seconds = record.time % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                html += `<tr>
                    <td>${index + 1}</td>
                    <td>${record.name}</td>
                    <td>${timeStr}</td>
                </tr>`;
            });
            
            html += '</table>';
        }
    }
    
    html += '<button class="modal-close">Закрыть</button>';
    html += '</div></div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function showHowToPlay() {
    const html = `
    <div class="modal">
        <div class="modal-content">
            <h3>Как играть</h3>
            <div class="instructions-list">
                <p><strong>Уровень 1:</strong> Добраться до правого края карты.</p>
                <p><strong>Уровень 2:</strong> Добраться до самого верха карты.</p>
                <p><strong>Управление:</strong></p>
                <ul>
                    <li>← → или A D - движение</li>
                    <li>↑ или W или Пробел - прыжок</li>
                    <li>ЛКМ - атака</li>
                    <li>SHIFT - рывок (требует зарядов)</li>
                </ul>
                <p><strong>Механика:</strong></p>
                <ul>
                    <li>Убивайте врагов атакой</li>
                    <li>За каждого убитого врага получаете заряд рывка</li>
                    <li>Падение с большой высоты смертельно</li>
                    <li>Столкновение с врагом убивает вас</li>
                    <li>После прохождения уровня 1 автоматически начинается уровень 2</li>
                </ul>
            </div>
            <button class="modal-close">Закрыть</button>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}
