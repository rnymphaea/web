class NewsHandler {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.newsList = [];
        this.template = document.getElementById('newsCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }
        await this.fetchNews();
        this.renderNews();
        this.bindEvents();
    }

    async fetchNews() {
        try {
            const response = await fetch(`/api/news/${this.userId}`);
            this.newsList = await response.json();
        } catch (error) {
            console.error('Failed to load news:', error);
        }
    }

    renderNews() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = '';
        if (this.newsList.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет новостей</p>';
            container.appendChild(emptyMessage);
            return;
        }
        this.newsList.forEach(item => {
            const card = this.createCard(item);
            container.appendChild(card);
        });
    }

    createCard(item) {
        const template = this.template.content.cloneNode(true);
        const card = template.querySelector('.col-12');
        card.querySelector('.news-author-name').textContent = item.authorName;
        card.querySelector('.news-date').textContent = item.date;
        card.querySelector('.news-content').textContent = item.content;
        return card;
    }

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = `friends.html?userId=${this.userId}`;
        });
    }
}

new NewsHandler();
