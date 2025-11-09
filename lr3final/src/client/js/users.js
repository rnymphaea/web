class UsersHandler {
    constructor() {
        this.usersList = [];
        this.template = null;
        this.modal = null;
        this.editingUser = null;
        document.addEventListener('DOMContentLoaded', () => {
            this.template = document.getElementById('userCardTemplate');
            const modalElement = document.getElementById('editUserModal');
            if (modalElement) this.modal = new bootstrap.Modal(modalElement);
            this.init();
        });
    }

    async init() {
        await this.fetchUsers();
        this.renderUsers();
        this.bindEvents();
    }

    async fetchUsers() {
        try {
            const response = await fetch('/api/users');
            this.usersList = await response.json();
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsers() {
        if (!this.template) return;
        const container = document.getElementById('usersContainer');
        if (!container) return;
        container.innerHTML = '';
        this.usersList.forEach(user => {
            const card = this.createCard(user);
            container.appendChild(card);
        });
    }

    createCard(user) {
        const template = this.template.content.cloneNode(true);
        const userCard = template.querySelector('.card');

        userCard.querySelector('.user-name').textContent = `${user.firstName} ${user.lastName}`;
        userCard.querySelector('.user-role').textContent = user.role === 'admin' ? 'Администратор' : 'Пользователь';
        userCard.querySelector('.user-status').textContent = this.getStatusText(user.status);
        userCard.querySelector('.user-email').textContent = user.email || '';
        userCard.querySelector('.user-birthdate').textContent = user.birthDate || '';

        const editBtn = userCard.querySelector('.user-edit-btn');
        const friendsBtn = userCard.querySelector('.user-friends-btn');
        const messagesBtn = userCard.querySelector('.user-messages-btn');

        const avatar = userCard.querySelector('.user-avatar');
        if (avatar) {
            avatar.src = `/images/users/${user.avatar || 'default.jpg'}`; // если avatar не задан, показываем default.jpg
            avatar.alt = `${user.firstName} ${user.lastName}`;
        }

        if (editBtn) editBtn.addEventListener('click', () => this.openModal(user));
        if (friendsBtn) friendsBtn.addEventListener('click', () => this.showFriends(user.id));
        if (messagesBtn) messagesBtn.addEventListener('click', () => this.showMessages(user.id));

        return userCard;
    }

    openModal(user) {
        if (!this.modal) return;
        this.editingUser = user;
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = `${user.firstName} ${user.lastName}`;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;
        this.modal.show();
    }

    getStatusText(status) {
        const statusMap = {
            active: 'Активный',
            blocked: 'Заблокирован',
            unconfirmed: 'Не подтверждён'
        };
        return statusMap[status] || status;
    }

    async saveChanges() {
        if (!this.editingUser) return;
        const userId = this.editingUser.id;
        const nameParts = document.getElementById('editUserName').value.split(' ');
        const newFirstName = nameParts[0] || '';
        const newLastName = nameParts[1] || '';
        const newRole = document.getElementById('editUserRole').value;
        const newStatus = document.getElementById('editUserStatus').value;
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: newFirstName,
                    lastName: newLastName,
                    role: newRole,
                    status: newStatus
                })
            });
            if (response.ok) {
                this.modal.hide();
                Object.assign(this.editingUser, { firstName: newFirstName, lastName: newLastName, role: newRole, status: newStatus });
                this.renderUsers();
                this.editingUser = null;
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    showFriends(userId) {
        window.location.href = `/friends.html?userId=${userId}`;
    }

    showMessages(userId) {
        window.location.href = `/messages.html?userId=${userId}`;
    }

    bindEvents() {
        const saveButton = document.getElementById('saveUserChanges');
        if (saveButton) saveButton.addEventListener('click', () => this.saveChanges());
    }
}

new UsersHandler();
