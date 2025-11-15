import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
})
export class RegistrationComponent {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.http.post('/api/users/register', this.user).subscribe(
      () => {
        alert('Регистрация успешна!');
        this.router.navigate(['/news']);
      },
      error => {
        console.error('Registration failed', error);
        alert('Ошибка регистрации');
      }
    );
  }
}
