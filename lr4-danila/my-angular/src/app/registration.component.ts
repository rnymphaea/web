import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Component({
    selector: "app-registration",
    templateUrl: './registration.component.html'
})

export class RegistrationComponent {
    registForm: FormGroup;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router
    ) {
    this.registForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        firstName: [''],
        middleName: [''],
        lastName: [''],
        birthday: ['']
    });
    }

    onSubmit() {
        this.isLoading = true;

        const data = this.registForm.value;
        console.log(data);

        this.apiService.registration(data).subscribe({
        next: (response) => {
            this.isLoading = false;
            console.log('Успешный вход:', response);

            localStorage.setItem('currentId', JSON.stringify(response.user.id));
            localStorage.setItem('isLoggedIn', 'true');

            this.router.navigate(['/']);
        },
        error: (error) => {
            this.isLoading = false;
            console.log(error.status);
            if (error.status === 409){
                alert('Пользователь существует');
            }
            }
        });
    }

    goHome(){
        this.router.navigate(['/']);
    }
}