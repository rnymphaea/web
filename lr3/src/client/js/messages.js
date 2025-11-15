class MessagesHandler {
    constructor() {
        this.currentUserId = new URLSearchParams(window.location.search).get('userId');
        this.messagesData = [];
        this.cardTemplate = document.getElementById('messageCardTemplate');
        this.init();
    }

    async init() {
        if (!this.currentUserId) {
            window.location.href = '/users.html';
            return;
        }
        this.setupEvents();
        await this.loadMessages();
        this.displayMessages();
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/messages/${this.currentUserId}`);
            this.messagesData = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }

    displayMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.messagesData.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет сообщений</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.messagesData.forEach(item => {
            const card = this.createMessageCard(item);
            container.appendChild(card);
        });
    }

    createMessageCard(message) {
        const template = this.cardTemplate.content.cloneNode(true);
        const card = template.firstElementChild;
        
        const senderElement = card.querySelector('.message-user-name');
        const receiverElement = card.querySelector('.message-receiver-name');
        const contentElement = card.querySelector('.message-content');
        const dateElement = card.querySelector('.message-date');
        
        if (senderElement) senderElement.textContent = message.senderName;
        if (receiverElement) receiverElement.textContent = message.receiverName;
        if (contentElement) contentElement.textContent = message.content;
        if (dateElement) dateElement.textContent = this.formatDate(message.date);
        
        return card;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    setupEvents() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/users.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MessagesHandler();
});
