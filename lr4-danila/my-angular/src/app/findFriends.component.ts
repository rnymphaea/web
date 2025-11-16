import { Component, OnInit } from "@angular/core";
import { io, Socket } from 'socket.io-client';
import { Router } from '@angular/router';
import { ApiService, User } from './api.service';
import { switchMap } from 'rxjs/operators';


@Component({
    selector: "app-find-friends",
    templateUrl: './findFriends.component.html'
})

export class FindFriendsComponent implements OnInit{
    users: User[] = [];
    user: any;

    constructor(private apiService: ApiService, private router: Router) {}

    ngOnInit(){
        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }

        const parsedUserId = JSON.parse(userId);
        
        this.apiService.getUserById(parsedUserId).pipe(
            switchMap(userResponse => {
                this.user = userResponse.user;
                return this.apiService.getUsers(this.user);
            })
        ).subscribe({
            next: (friendsResponse) => {
                this.users = friendsResponse.users;
            },
            error: (error) => {
                console.error('Ошибка:', error);
            }
        });
    }

    addToFriends(id: number) {
        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }
        const parsedUserId = JSON.parse(userId);
        this.apiService.addFriend(parsedUserId, id).subscribe({
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