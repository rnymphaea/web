import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css']
})
export class FriendListComponent implements OnInit {
  friends: any[] = [];
  currentUser: User | null = null;
  isLoading: boolean = true;
  searchQuery: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  showAddFriend: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.loadFriends(user.id);
      }
    });
  }

  loadFriends(userId: number) {
    this.isLoading = true;
    this.userService.getFriends(userId).subscribe({
      next: (friends) => {
        this.friends = friends;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading friends:', error);
        this.isLoading = false;
      }
    });
  }

  searchUsers() {
    if (this.searchQuery.trim().length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.userService.searchUsers(this.searchQuery, this.currentUser!.id).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.isSearching = false;
      }
    });
  }

  addFriend(friendId: number) {
    this.userService.addFriend(this.currentUser!.id, friendId).subscribe({
      next: (response: any) => {
        alert(response.message || 'Пользователь добавлен в друзья');
        this.loadFriends(this.currentUser!.id);
        this.searchQuery = '';
        this.searchResults = [];
        this.showAddFriend = false;
      },
      error: (error) => {
        alert(error.error?.error || 'Ошибка при добавлении в друзья');
      }
    });
  }

  isAlreadyFriend(userId: number): boolean {
    return this.friends.some(friend => friend.id === userId);
  }

  openChat(friendId: number) {
    this.router.navigate(['/messages', friendId]);
  }

  toggleAddFriend() {
    this.showAddFriend = !this.showAddFriend;
    this.searchQuery = '';
    this.searchResults = [];
  }

  // Новый метод для получения URL аватарки
  getAvatarUrl(userId: number): string {
    return this.userService.getAvatarUrl(userId);
  }

  // Обработчик ошибок загрузки изображений
  handleImageError(event: any) {
    event.target.style.display = 'none';
    event.target.nextElementSibling?.style.display?.('block');
  }
}
