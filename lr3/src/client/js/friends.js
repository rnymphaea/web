class FriendsHandler {
    constructor() {
        this.currentUserId = new URLSearchParams(window.location.search).get('userId');
        this.friendsData = [];
        this.cardTemplate = document.getElementById('friendCardTemplate');
        this.init();
    }

    async init() {
        if (!this.currentUserId) {
            window.location.href = '/users.html';
            return;
        }
        await this.loadFriends();
        this.displayFriends();
        this.setupEvents();
    }

    async loadFriends() {
        try {
            const response = await fetch(`/api/friends/${this.currentUserId}`);
            this.friendsData = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки друзей:', error);
        }
    }

    displayFriends() {
        const container = document.getElementById('friendsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.friendsData.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет друзей</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.friendsData.forEach(friend => {
            const card = this.createFriendCard(friend);
            container.appendChild(card);
        });
    }

    createFriendCard(friend) {
        const template = this.cardTemplate.content.cloneNode(true);
        const card = template.firstElementChild;
        const nameElement = card.querySelector('.friend-name');
        
        if (nameElement) {
            nameElement.textContent = `${friend.firstName} ${friend.lastName}`;
        }
        
        return card;
    }

    showNews() {
        window.location.href = `/news.html?userId=${this.currentUserId}`;
    }

    setupEvents() {
        const newsBtn = document.getElementById('newsBtn');
        const backBtn = document.getElementById('backBtn');
        
        if (newsBtn) {
            newsBtn.addEventListener('click', () => this.showNews());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/users.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FriendsHandler();
});
