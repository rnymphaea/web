class FriendsHandler {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.friendsList = [];
        this.template = document.getElementById('friendCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }
        await this.fetchFriends();
        this.renderFriends();
        this.bindEvents();
    }

    async fetchFriends() {
        try {
            const response = await fetch(`/api/friends/${this.userId}`);
            this.friendsList = await response.json();
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }

    renderFriends() {
        const container = document.getElementById('friendsContainer');
        if (!container) return;
        container.innerHTML = '';
        if (this.friendsList.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет друзей</p>';
            container.appendChild(emptyMessage);
            return;
        }
        this.friendsList.forEach(friend => {
            const card = this.createCard(friend);
            container.appendChild(card);
        });
    }

    createCard(friend) {
        const template = this.template.content.cloneNode(true);
        const card = template.firstElementChild;
        const nameElement = card.querySelector('.friend-name');
        if (nameElement) nameElement.textContent = `${friend.firstName} ${friend.lastName}`;
        return card;
    }

    showNews() {
        window.location.href = `/news.html?userId=${this.userId}`;
    }

    bindEvents() {
        const newsButton = document.getElementById('newsBtn');
        const backButton = document.getElementById('backBtn');
        if (newsButton) newsButton.addEventListener('click', () => this.showNews());
        if (backButton) backButton.addEventListener('click', () => {
            window.location.href = '/users.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FriendsHandler();
});
