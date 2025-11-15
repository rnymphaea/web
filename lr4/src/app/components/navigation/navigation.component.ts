import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navigation',
  template: `
    <nav class="navbar">
      <div class="nav-brand">Социальная сеть</div>
      <div class="nav-links">
        <a routerLink="/news">Лента новостей</a>
        <a routerLink="/add-news">Добавить новость</a>
        
        <!-- ✅ ССЫЛКА НА АДМИН-МОДУЛЬ ДЛЯ АДМИНИСТРАТОРОВ -->
        <a 
          *ngIf="isAdmin()" 
          href="/admin/users.html" 
          target="_blank" 
          class="admin-link"
        >
          Админ-панель
        </a>
        
        <button *ngIf="!currentUser" routerLink="/register">Регистрация</button>
        <span *ngIf="currentUser">
          Привет, {{currentUser.firstName}}!
        </span>
      </div>
    </nav>
  `
})
export class NavigationComponent {
  currentUser: User | null = null;

  constructor(private userService: UserService) {
    this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
