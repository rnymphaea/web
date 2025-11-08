class UserManager {
    constructor() {
        this.users = [];
        this.init();
    }

    async init() {
        await this.loadUsers();
        this.renderUsers();
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            this.users = await response.json();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    renderUsers() {
        const userList = document.getElementById('userList');
        userList.innerHTML = this.users.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <img src="/images/${user.photo}" alt="${user.name}">
                    <div class="user-details">
                        <h5>${user.name}</h5>
                        <p>Email: ${user.email}</p>
                        <p>Role: ${user.role} | Status: ${user.status}</p>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn-primary" onclick="userManager.editUser(${user.id})">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        const newRole = prompt('Enter new role (admin/user):', user.role);
        
        if (newRole) {
            try {
                await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole })
                });
                await this.loadUsers();
                this.renderUsers();
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
    }
}

const userManager = new UserManager();
