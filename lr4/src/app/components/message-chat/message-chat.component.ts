import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { MessageService, Message } from '../../services/message.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-chat',
  templateUrl: './message-chat.component.html',
  styleUrls: ['./message-chat.component.css']
})
export class MessageChatComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  friend: any = null;
  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = true;
  
  private userSubscription: Subscription = new Subscription();
  private routeSubscription: Subscription = new Subscription();
  private messagesSubscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.userSubscription = this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadFriendAndMessages();
      }
    });

    this.messagesSubscription = this.messageService.messages$.subscribe(messages => {
      if (this.currentUser && this.friend) {
        this.messages = this.messageService.getConversation(this.currentUser.id, this.friend.id);
        this.scrollToBottom();
      }
    });
  }

  loadFriendAndMessages() {
    this.routeSubscription = this.route.params.subscribe(params => {
      const friendId = +params['friendId'];
      
      this.userService.getFriends(this.currentUser!.id).subscribe(friends => {
        this.friend = friends.find(f => f.id === friendId);
        
        if (this.friend) {
          this.messageService.getMessages(this.currentUser!.id).subscribe({
            next: () => {
              this.messages = this.messageService.getConversation(this.currentUser!.id, friendId);
              this.isLoading = false;
              this.scrollToBottom();
            },
            error: (error) => {
              console.error('Error loading messages:', error);
              this.isLoading = false;
            }
          });
        }
      });
    });
  }

  sendMessage() {
    if (this.newMessage.trim() && this.currentUser && this.friend) {
      this.messageService.sendMessage(
        this.currentUser.id,
        this.friend.id,
        this.newMessage.trim()
      ).subscribe({
        next: () => {
          this.newMessage = '';
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error sending message:', error);
          alert('Ошибка при отправке сообщения');
        }
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const messageContainer = document.querySelector('.messages-container');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }, 100);
  }

  // Новый метод для получения URL аватарки
  getAvatarUrl(userId: number): string {
    return this.userService.getAvatarUrl(userId);
  }

  // Обработчик ошибок загрузки изображений
  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
    this.messagesSubscription.unsubscribe();
  }
}
