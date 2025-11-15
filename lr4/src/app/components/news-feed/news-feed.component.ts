import { Component, OnInit } from '@angular/core';
import { NewsService } from '../../services/news.service';
import { NewsPost } from '../../models/news.model';

@Component({
  selector: 'app-news-feed',
  templateUrl: './news-feed.component.html'
})
export class NewsFeedComponent implements OnInit {
  news: NewsPost[] = [];

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    const currentUserId = 1; // В реальном приложении из сервиса авторизации
    this.newsService.getNews(currentUserId).subscribe(news => {
      this.news = news;
    });

    // Подписываемся на обновления через WebSocket
    this.newsService.getNewsStream().subscribe(news => {
      this.news = news;
    });
  }
}
