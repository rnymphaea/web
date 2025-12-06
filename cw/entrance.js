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
});

function showRecordsTable() {
    const records = JSON.parse(localStorage.getItem('gameRecords') || '[]');
    
    let html = '<div class="modal"><div class="modal-content">';
    html += '<h3>Таблица рекордов</h3>';
    
    if (records.length === 0) {
        html += '<p>Пока нет записей</p>';
    } else {
        html += '<table class="records-table">';
        html += '<tr><th>Место</th><th>Имя</th><th>Время</th><th>Прогресс</th><th>Дата</th></tr>';
        
        records.sort((a, b) => b.score - a.score || a.time - b.time);
        
        records.slice(0, 10).forEach((record, index) => {
            const minutes = Math.floor(record.time / 60);
            const seconds = record.time % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            html += `<tr>
                <td>${index + 1}</td>
                <td>${record.name}</td>
                <td>${timeStr}</td>
                <td>${record.progress}%</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
            </tr>`;
        });
        
        html += '</table>';
    }
    
    html += '<button class="modal-close" onclick="closeModal()">Закрыть</button>';
    html += '</div></div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function showHowToPlay() {
    const html = `
    <div class="modal">
        <div class="modal-content">
            <h3>Как играть</h3>
            <div class="instructions-list">
                <p><strong>Цель игры:</strong> Добраться до правого края карты, избегая врагов.</p>
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
                </ul>
            </div>
            <button class="modal-close" onclick="closeModal()">Закрыть</button>
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
