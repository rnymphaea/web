import { Component, OnInit, OnDestroy } from '@angular/core';
import { NewsService, NewsPost } from '../../services/news.service';
import { UserService, User } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news-feed',
  templateUrl: './news-feed.component.html'
})
export class NewsFeedComponent implements OnInit, OnDestroy {
  news: NewsPost[] = [];
  currentUserId: number = 0;
  isLoading: boolean = true;
  private userSubscription: Subscription = new Subscription();
  private newsSubscription: Subscription = new Subscription();

  constructor(
    private newsService: NewsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userSubscription = this.userService.getCurrentUser().subscribe((user: User | null) => {
      if (user) {
        this.currentUserId = user.id;
        this.loadNews();
      }
    });

    this.newsSubscription = this.newsService.news$.subscribe((news: NewsPost[]) => {
      this.news = news;
    });
  }

  loadNews() {
    this.isLoading = true;
    this.newsService.getNews(this.currentUserId).subscribe({
      next: (news) => {
        this.news = news;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading news:', error);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.newsSubscription.unsubscribe();
  }
}
