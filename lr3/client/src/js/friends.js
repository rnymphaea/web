class FriendsManager {
    constructor() {
        this.userId = 1;
        this.init();
    }

    async init() {
        await this.loadFriends();
    }

    async loadFriends() {
        try {
            const response = await fetch(`/api/friends/${this.userId}`);
            const data = await response.json();
            this.renderFriends(data.friends);
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    async renderFriends(friendIds) {
        const friendsList = document.getElementById('friendsList');
        
        const usersResponse = await fetch('/api/users');
        const allUsers = await usersResponse.json();
        const friends = allUsers.filter(user => friendIds.includes(user.id));
        
        friendsList.innerHTML = friends.map(friend => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${friend.name}</h5>
                    <p class="card-text">${friend.email}</p>
                    <p class="card-text">Status: ${friend.status}</p>
                </div>
            </div>
        `).join('');
    }
}

new FriendsManager();
