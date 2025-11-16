import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Component({
    selector: "app-login",
    templateUrl: './signin.component.html'
})

export class SignInComponent {
    loginForm: FormGroup;
    isLoading = false;
    isError = false;

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router
    ) {
    this.loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });
    }

    onSubmit() {
        this.isLoading = true;

        const { email } = this.loginForm.value;

        this.apiService.login(email).subscribe({
        next: (response) => {
            this.isLoading = false;
            console.log('Успешный вход:', response);

            localStorage.setItem('currentId', JSON.stringify(response.user.id));
            localStorage.setItem('isLoggedIn', 'true');

            this.router.navigate(['/']);
        },
        error: (error) => {
            this.isLoading = false;
            this.isError = true;
            }
        });
    }

    goHome(){
        this.router.navigate(['/']);
    }
}