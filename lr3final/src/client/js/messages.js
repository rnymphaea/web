class MessagesManager {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('userId');
        this.messages = [];
        this.messageCardTemplate = document.getElementById('messageCardTemplate');

        if (!this.messageCardTemplate) {
            console.error('Template #messageCardTemplate not found!');
            return;
        }

        this.init();
    }

    async init() {
        if (!this.userId) {
            window.location.href = '/users.html';
            return;
        }

        this.setupEventListeners();
        await this.loadMessages();
        this.renderMessages();
    }

    async loadMessages() {
        try {
            const response = await fetch(`/api/messages/${this.userId}`);
            this.messages = await response.json();
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) {
            console.error('Container #messagesContainer not found!');
            return;
        }

        container.innerHTML = '';

        if (this.messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'col-12';
            emptyMessage.innerHTML = '<p class="text-center">Нет сообщений</p>';
            container.appendChild(emptyMessage);
            return;
        }

        this.messages.forEach(item => {
            const messageCard = this.createMessageCard(item);
            container.appendChild(messageCard);
        });
    }

    createMessageCard(messageItem) {
        const template = this.messageCardTemplate.content.cloneNode(true);
        const messageCard = template.firstElementChild;

        const senderEl = messageCard.querySelector('.message-user-name');
        const receiverEl = messageCard.querySelector('.message-receiver-name');
        const contentEl = messageCard.querySelector('.message-content');
        const dateEl = messageCard.querySelector('.message-date');

        if (senderEl) senderEl.textContent = messageItem.senderName;
        if (receiverEl) receiverEl.textContent = messageItem.receiverName;
        if (contentEl) contentEl.textContent = messageItem.content;
        if (dateEl) dateEl.textContent = this.formatDate(messageItem.date);

        return messageCard;
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

    setupEventListeners() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '/users.html';
            });
        }
    }
}

// Инициализация после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new MessagesManager();
});

