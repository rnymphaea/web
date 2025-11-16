import { Component, OnInit } from "@angular/core";
import { io, Socket } from 'socket.io-client';
import { ActivatedRoute } from '@angular/router';
import { ApiService, User } from './api.service';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';


@Component({
    selector: "app-messages",
    templateUrl: './messages.component.html'
})

export class MessagesComponent implements OnInit{
    private socket: Socket | undefined;
    messageText: string = '';
    news: Array<any> = [];
    user: any;

    constructor(private apiService: ApiService, private router: ActivatedRoute, private routerNav: Router) {}

    ngOnInit(){
        this.socket = io('http://localhost:3000');

        const userId = localStorage.getItem('currentId');
        if (!userId) {
            return;
        }
        const parsedUserId = JSON.parse(userId);
        this.apiService.getUserById(parsedUserId).subscribe({
            next: (userResponse => {
                this.user = userResponse.user;
            })
        });
        
        this.socket.on('connect', () => {
            if (this.socket)
                this.socket.emit("connNews", {userId: localStorage.getItem('currentId')})
        })

        this.socket.on('news', (msg: any) => {
            if (this.user.listOfFriends.indexOf(Number(msg.id_src)) === -1 && msg.id_src != this.user.id){
                return;
            }
            this.news = [];
            for (let i = 0; i < msg.messages.length; i++){
                const user = msg.messages[i].user;
                if (this.user.listOfFriends.indexOf(user.id) === -1 && user.id != this.user.id){
                    continue;
                }
                const text = msg.messages[i].messageText;
                this.news.push({user: user.firstName, textMessage: text});
            }
        })
    }

    sendNews(msg: string) {
        this.messageText = msg;
        if (this.messageText.trim() && this.socket) {
            this.socket.emit('news', {
                userId: localStorage.getItem('currentId'),
                value: this.messageText
            });
            this.messageText = '';
        }
    }

    goHome(){
        this.routerNav.navigate(['/']);
    }
}