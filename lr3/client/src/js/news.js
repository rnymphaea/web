class NewsManager {
    constructor() {
        this.userId = 1;
        this.init();
    }

    async init() {
        await this.loadNews();
    }

    async loadNews() {
        try {
            const response = await fetch(`/api/messages/friends/${this.userId}`);
            const news = await response.json();
            this.renderNews(news);
        } catch (error) {
            console.error('Error loading news:', error);
        }
    }

    renderNews(news) {
        const newsList = document.getElementById('newsList');
        newsList.innerHTML = news.map(item => `
            <div class="card mb-3">
                <div class="card-body">
                    <p class="card-text">${item.content}</p>
                    <small class="text-muted">${new Date(item.date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }
}

new NewsManager();
