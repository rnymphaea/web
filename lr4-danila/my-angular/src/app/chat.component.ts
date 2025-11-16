import { Component, OnInit } from "@angular/core";
import { io, Socket } from 'socket.io-client';
import { ActivatedRoute } from '@angular/router';
import { ApiService, User } from './api.service';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: "app-chat",
    templateUrl: './chat.component.html'
})

export class ChatComponent implements OnInit {
    private socket: Socket | undefined;
    messageText: string = '';
    isConnected: boolean = false;
    messages: Array<any> = [];
    user: any;
    date: string = '';

    constructor(
        private apiService: ApiService,
        private router: ActivatedRoute,
        private routerNav: Router
    ){

    }

    ngOnInit() {
        this.socket = io('http://localhost:3000');
        
        this.socket.on('connect', () => {
            if (this.socket)
                this.socket.emit("connChats", {from: localStorage.getItem('currentId'), to: this.router.snapshot.paramMap.get('id')})
        })

        this.socket.on('msg', (msg: any) => {
            console.log(msg);
            if (!(msg.id_source == localStorage.getItem('currentId') && msg.id_dest == this.router.snapshot.paramMap.get('id') ||
                msg.id_dest == localStorage.getItem('currentId') && msg.id_source == this.router.snapshot.paramMap.get('id'))){
                return;
            }
            this.messages = [];
            console.log(msg.chats);
            for (let i = 0; i < msg.chats.length; i++){
                const userId = msg.chats[i].id_user_src;
                if (!userId){
                    return;
                }
                this.apiService.getUserById(JSON.parse(userId)).subscribe({
                    next: (response) => {
                        this.user = response.user;
                        const text = msg.chats[i].text;
                        const date = msg.chats[i].date;
                        this.date = date;
                        this.messages.push({user: this.user.firstName, textMessage: text, id: i, date: date});
                    }
                });
            }
            setTimeout(() => {
                this.messages = this.messages.sort((a, b) => a.id - b.id);
            }, 100);

        })
        this.isConnected = true;
    }

    sendMessage(msg: string) {
        this.messageText = msg;
        if (this.messageText.trim() && this.socket) {
            this.socket.emit('msg', {
                from: localStorage.getItem('currentId'),
                to: this.router.snapshot.paramMap.get('id'),
                value: this.messageText
            });
            this.messageText = '';
        }
    }

    goHome(){
        this.routerNav.navigate(['/']);
    }
}