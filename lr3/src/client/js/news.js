class NewsHandler {
    constructor() {
        this.currentUserId = new URLSearchParams(window.location.search).get('userId');
        this.newsData = [];
        this.cardTemplate = document.getElementById('newsCardTemplate');
        this.init();
    }

    async init() {
        if (!this.currentUserId) {
            window.location.href = '/users.html';
            return;
        }
        await this.loadNews();
        this.displayNews();
        this.setupEvents();
    }

    async loadNews() {
        try {
            const response = await fetch(`/api/news/${this.currentUserId}`);
            this.newsData = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
        }
    }

    displayNews() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = '';
        
        if (this.newsData.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет новостей</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.newsData.forEach(item => {
            const card = this.createNewsCard(item);
            container.appendChild(card);
        });
    }

    createNewsCard(item) {
        const template = this.cardTemplate.content.cloneNode(true);
        const card = template.querySelector('.col-12');
        
        card.querySelector('.news-author-name').textContent = item.authorName;
        card.querySelector('.news-date').textContent = item.date;
        card.querySelector('.news-content').textContent = item.content;
        
        return card;
    }

    setupEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = `friends.html?userId=${this.currentUserId}`;
        });
    }
}

new NewsHandler();
