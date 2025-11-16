import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';

export interface Message {
  id: number;
  user_id: number;
  recipient_id: number;
  content: string;
  date: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:3000/api';
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    // Подписываемся на новые сообщения через WebSocket
    this.wsService.getMessages().subscribe((message: any) => {
      if (message.type === 'NEW_MESSAGE') {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message.data]);
      }
    });
  }

  getMessages(userId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/${userId}`, {
      withCredentials: true
    }).pipe(
      tap(messages => this.messagesSubject.next(messages))
    );
  }

  sendMessage(senderId: number, recipientId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, {
      senderId,
      recipientId,
      content
    }, {
      withCredentials: true
    });
  }

  getConversation(userId: number, friendId: number): Message[] {
    return this.messagesSubject.value.filter(message => 
      (message.user_id === userId && message.recipient_id === friendId) ||
      (message.user_id === friendId && message.recipient_id === userId)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
