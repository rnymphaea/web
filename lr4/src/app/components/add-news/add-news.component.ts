import { Component } from '@angular/core';
import { NewsService } from '../../services/news.service';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-add-news',
  templateUrl: './add-news.component.html'
})
export class AddNewsComponent {
  newPostContent = '';
  currentUser: User | null = null;
  isLoading: boolean = false;

  constructor(
    private newsService: NewsService,
    private userService: UserService
  ) {
    this.userService.getCurrentUser().subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  addPost() {
    if (this.newPostContent.trim() && this.currentUser) {
      this.isLoading = true;
      
      const postData = {
        authorId: this.currentUser.id,
        content: this.newPostContent,
        authorName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
      };
      
      this.newsService.createPost(postData).subscribe({
        next: () => {
          this.newPostContent = '';
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error creating post:', error);
          alert('Ошибка при добавлении новости');
          this.isLoading = false;
        }
      });
    }
  }
}
