import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { ApiService, User } from './api.service';
import { switchMap } from 'rxjs/operators';

@Component({
    selector: "app-friends",
    templateUrl: './friends.component.html'
})

export class FriendsComponent implements OnInit {
    friends: User[] = [];
    user: any;
    
    constructor(
        private apiService: ApiService,
        private router: Router,
    ){}

    ngOnInit() {
        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }

        const parsedUserId = JSON.parse(userId);
        
        this.apiService.getUserById(parsedUserId).pipe(
            switchMap(userResponse => {
                this.user = userResponse.user;
                return this.apiService.getFriends(this.user);
            })
        ).subscribe({
            next: (friendsResponse) => {
                this.friends = friendsResponse.friends;
            },
            error: (error) => {
                console.error('Ошибка:', error);
            }
        });
    }

    toChat(id: number){
        this.router.navigate(['/chat', id]);
    }

    deleteFriend(id: number){
        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }
        const parsedUserId = JSON.parse(userId);
        this.apiService.deleteFriend(parsedUserId, id).subscribe({
        next: (response) => {
            this.router.navigate(['/']);
        },
        error: (error) => {
            console.error('Ошибка входа:', error);
            }
        });
    }

    goHome(){
        this.router.navigate(['/']);
    }
}