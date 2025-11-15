import { Component } from '@angular/core';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-add-news',
  templateUrl: './add-news.component.html'
})
export class AddNewsComponent {
  newPostContent = '';

  constructor(private newsService: NewsService) {}

  addPost() {
    if (this.newPostContent.trim()) {
      this.newsService.createPost({
        authorId: 1, // Текущий пользователь
        content: this.newPostContent
      }).subscribe(() => {
        this.newPostContent = '';
        alert('Новость добавлена!');
      });
    }
  }
}
