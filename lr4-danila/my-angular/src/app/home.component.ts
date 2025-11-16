import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Component({
    selector: "app-home",
    templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit{
    user: any;
    isLogin: boolean = false;
    hasPhoto: boolean = false;
    isAdmin: boolean = false;
    photoUrl: string = '';
    selectedFile: File | null = null;

    constructor(private apiService: ApiService, private router: Router) {
    }

    ngOnInit(){
        const userId = localStorage.getItem('currentId');
        if (!userId){
            return;
        }
        this.apiService.getUserById(JSON.parse(userId)).subscribe({
            next: (response) => {
                this.user = response.user;
                this.hasPhoto = this.user.hasPhoto ? true : false;
                this.isAdmin = this.user.role === "admin";
                if (this.hasPhoto){
                    this.photoUrl = this.apiService.getUserPhoto(this.user.id);
                }
            },
            error: (error) => {
                console.error('Ошибка входа:', error);
                localStorage.setItem('isLoggedIn', 'false');
            }
        });
        this.isLogin = localStorage.getItem('isLoggedIn') === 'true';
    }

    loginUser(){
        this.router.navigate(['/login']);
    }

    registrationUser(){
        this.router.navigate(['/registration']);
    }

    toListFriends(){
        this.router.navigate(['/friends']);
    }

    toFindFriends(){
        this.router.navigate(['/findFriends']);
    }

    toListMessages(){
        this.router.navigate(['/messages']);
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;
        }
    }

    onSubmit(){
        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }

        const parsedUserId = JSON.parse(userId);
        if (!this.selectedFile){
            return;
        }
        this.apiService.sendPhoto(parsedUserId, this.selectedFile).subscribe({
            next: (response) => {
                console.log(response)
            },
            error: (error) => {
                console.error('Ошибка входа:', error);
            }
        });;
    }

    admin(){
        this.apiService.toAdmin();
    }
}