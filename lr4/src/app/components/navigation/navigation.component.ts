import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html'
})
export class NavigationComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  isAdmin(): boolean {
    return this.userService.canAccessAdmin();
  }

  openAdminPanel() {
    // Пробуем открыть HTTPS версию на порту 3001
    const adminUrl = 'https://localhost:3001';
    
    // Создаем тестовый запрос чтобы проверить доступность
    fetch(adminUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // no-cors чтобы избежать CORS ошибок при проверке
    })
    .then(() => {
      // Если запрос прошел, открываем админ-панель
      window.open(adminUrl, '_blank');
    })
    .catch((error) => {
      console.log('HTTPS admin panel not available, trying HTTP...');
      
      // Если HTTPS недоступен, пробуем HTTP версию на порту 3000
      const fallbackUrl = '/admin-panel';
      window.open(fallbackUrl, '_blank');
      
      // Показываем сообщение пользователю
      alert(`Админ-панель недоступна по HTTPS (порт 3001). 
Попробуйте:
1. Убедитесь что админ-модуль установлен
2. Запустите: npm run build:admin
3. Перезапустите сервер`);
    });
  }

  logout() {
    this.userService.logout();
    window.location.reload();
  }
}
