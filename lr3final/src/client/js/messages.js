class MessagesHandler {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.messagesList = [];
        this.template = document.getElementById('messageCardTemplate');
        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }
        this.bindEvents();
        await this.fetchMessages();
        this.renderMessages();
    }

    async fetchMessages() {
        try {
            const response = await fetch(`/api/messages/${this.userId}`);
            this.messagesList = await response.json();
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        container.innerHTML = '';
        if (this.messagesList.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет сообщений</p>';
            container.appendChild(emptyMessage);
            return;
        }
        this.messagesList.forEach(item => {
            const card = this.createCard(item);
            container.appendChild(card);
        });
    }

    createCard(message) {
        const template = this.template.content.cloneNode(true);
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

    bindEvents() {
        const backButton = document.getElementById('backBtn');
        if (backButton) backButton.addEventListener('click', () => {
            window.location.href = '/users.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MessagesHandler();
});
