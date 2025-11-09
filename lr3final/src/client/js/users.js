class UserManager {
    constructor() {
        this.users = [];
        this.userCardTemplate = null;
        this.editModal = null;
        this.currentEditingUser = null;

        document.addEventListener('DOMContentLoaded', () => {
            this.userCardTemplate = document.getElementById('userCardTemplate');

            const modalEl = document.getElementById('editUserModal');
            if (modalEl) {
                this.editModal = new bootstrap.Modal(modalEl);
            }

            this.init();
        });
    }

    async init() {
        await this.loadUsers();
        this.renderUsers();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            this.users = await response.json();
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    renderUsers() {
        if (!this.userCardTemplate) return;
        const container = document.getElementById('usersContainer');
        if (!container) return;

        container.innerHTML = '';
        this.users.forEach(user => {
            const userCard = this.createUserCard(user);
            container.appendChild(userCard);
        });
    }

    createUserCard(user) {
        const template = this.userCardTemplate.content.cloneNode(true);
        const userCard = template.querySelector('.card');

        userCard.querySelector('.user-name').textContent = `${user.firstName} ${user.lastName}`;
        userCard.querySelector('.user-role').textContent = user.role === 'admin' ? 'Администратор' : 'Пользователь';
        userCard.querySelector('.user-status').textContent = this.getStatusText(user.status);

        const editBtn = userCard.querySelector('.user-edit-btn');
        const friendsBtn = userCard.querySelector('.user-friends-btn');
        const messagesBtn = userCard.querySelector('.user-messages-btn');

        if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(user));
        if (friendsBtn) friendsBtn.addEventListener('click', () => this.viewFriends(user.id));
        if (messagesBtn) messagesBtn.addEventListener('click', () => this.viewMessages(user.id));

        return userCard;
    }

    openEditModal(user) {
        if (!this.editModal) return;

        this.currentEditingUser = user;
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = `${user.firstName} ${user.lastName}`;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;

        this.editModal.show();
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
                this.editModal.hide();
                Object.assign(this.currentEditingUser, { firstName: newFirstName, lastName: newLastName, role: newRole, status: newStatus });
                this.renderUsers();
                this.currentEditingUser = null;
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    }

    viewFriends(userId) {
        window.location.href = `/friends.html?userId=${userId}`;
    }

    viewMessages(userId) {
        window.location.href = `/messages.html?userId=${userId}`;
    }

    setupEventListeners() {
        const saveBtn = document.getElementById('saveUserChanges');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveUserChanges());
    }
}

const userManager = new UserManager();

