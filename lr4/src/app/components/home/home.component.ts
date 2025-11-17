import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-container">
      <h1>Добро пожаловать в социальную сеть!</h1>
      <p>Пожалуйста, войдите или зарегистрируйтесь.</p>
      <div class="home-actions">
        <button routerLink="/login" class="btn-primary">Войти</button>
        <button routerLink="/register" class="btn-secondary">Регистрация</button>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      text-align: center;
      padding: 50px 20px;
    }
    .home-actions {
      margin-top: 30px;
    }
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      margin: 0 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-primary {
      background: #3498db;
      color: white;
    }
    .btn-secondary {
      background: #2ecc71;
      color: white;
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe(user => {
      if (user) {
        this.router.navigate(['/news']);
      }
    });
  }
}
