import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="registration-container">
      <h2>Вход в систему</h2>
      <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
        <div>
          <input type="email" [(ngModel)]="credentials.email" name="email" 
                 placeholder="Email" required>
        </div>
        <div>
          <input type="password" [(ngModel)]="credentials.password" name="password" 
                 placeholder="Пароль" required>
        </div>
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" [disabled]="!loginForm.form.valid || isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
      <p>Нет аккаунта? <a routerLink="/register">Зарегистрируйтесь</a></p>
    </div>
  `,
  styles: [`
    .error-message {
      color: #e74c3c;
      margin: 10px 0;
    }
  `]
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.login(this.credentials.email, this.credentials.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/news']);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Ошибка входа';
      }
    });
  }
}
