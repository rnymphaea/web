class UsersHandler {
    constructor() {
        this.usersData = [];
        this.cardTemplate = null;
        this.modal = null;
        this.currentEditingUser = null;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.cardTemplate = document.getElementById('userCardTemplate');
            const modalElement = document.getElementById('editUserModal');
            if (modalElement) this.modal = new bootstrap.Modal(modalElement);
            this.init();
        });
    }

    async init() {
        await this.loadUsers();
        this.displayUsers();
        this.setupEvents();
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            this.usersData = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    displayUsers() {
        if (!this.cardTemplate) return;
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.usersData.forEach(user => {
            const card = this.createUserCard(user);
            container.appendChild(card);
        });
    }

    createUserCard(user) {
        const template = this.cardTemplate.content.cloneNode(true);
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
            avatar.src = `/images/users/${user.avatar || 'default.jpg'}`;
            avatar.alt = `${user.firstName} ${user.lastName}`;
        }

        if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(user));
        if (friendsBtn) friendsBtn.addEventListener('click', () => this.showFriends(user.id));
        if (messagesBtn) messagesBtn.addEventListener('click', () => this.showMessages(user.id));

        return userCard;
    }

    openEditModal(user) {
        if (!this.modal) return;
        this.currentEditingUser = user;
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

    async saveUserChanges() {
        if (!this.currentEditingUser) return;
        const userId = this.currentEditingUser.id;
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
                Object.assign(this.currentEditingUser, { 
                    firstName: newFirstName, 
                    lastName: newLastName, 
                    role: newRole, 
                    status: newStatus 
                });
                this.displayUsers();
                this.currentEditingUser = null;
            }
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
        }
    }

    showFriends(userId) {
        window.location.href = `/friends.html?userId=${userId}`;
    }

    showMessages(userId) {
        window.location.href = `/messages.html?userId=${userId}`;
    }

    setupEvents() {
        const saveBtn = document.getElementById('saveUserChanges');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveUserChanges());
    }
}

new UsersHandler();
