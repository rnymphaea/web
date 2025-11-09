class FriendsManager {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.friends = [];
        this.friendCardTemplate = document.getElementById('friendCardTemplate');

        if (!this.friendCardTemplate) {
            console.error('Template #friendCardTemplate not found!');
            return;
        }

        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }

        await this.loadFriends();
        this.renderFriends();
        this.setupEventListeners();
    }

    async loadFriends() {
        try {
            const response = await fetch(`/api/friends/${this.userId}`);
            this.friends = await response.json();
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }

    renderFriends() {
        const container = document.getElementById('friendsContainer');
        if (!container) {
            console.error('Container #friendsContainer not found!');
            return;
        }

        container.innerHTML = ''; // Очистка контейнера

        if (this.friends.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет друзей</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.friends.forEach(friend => {
            const friendCard = this.createFriendCard(friend);
            container.appendChild(friendCard);
        });
    }

    createFriendCard(friend) {
        const template = this.friendCardTemplate.content.cloneNode(true);
        const friendCard = template.firstElementChild;

        // Безопасная запись, чтобы не было ошибок null
        const nameEl = friendCard.querySelector('.friend-name');
        const emailEl = friendCard.querySelector('.friend-email');
        const dateEl = friendCard.querySelector('.friendship-date');

        if (nameEl) nameEl.textContent = `${friend.firstName} ${friend.lastName}`;
        if (emailEl) emailEl.textContent = friend.email;
        if (dateEl) dateEl.textContent = friend.friendshipDate;

        return friendCard;
    }

    viewNews() {
        window.location.href = `/news.html?userId=${this.userId}`;
    }

    setupEventListeners() {
        const newsBtn = document.getElementById('newsBtn');
        const backBtn = document.getElementById('backBtn');

        if (newsBtn) {
            newsBtn.addEventListener('click', () => this.viewNews());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/users.html';
            });
        }
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new FriendsManager();
});

