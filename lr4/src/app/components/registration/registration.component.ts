import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
})
export class RegistrationComponent {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthDate: ''
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

    this.userService.register(this.user).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Регистрация успешна!');
        this.router.navigate(['/news']);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Ошибка регистрации';
        console.error('Registration failed', error);
      }
    });
  }
}
