import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';

export interface NewsPost {
  id: number;
  authorId: number;
  authorName?: string;
  content: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsSubject = new BehaviorSubject<NewsPost[]>([]);
  public news$ = this.newsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    // REAL-TIME ОБНОВЛЕНИЕ ЧЕРЕЗ WEBSOCKET
    this.wsService.getMessages().subscribe((message: any) => {
      if (message.type === 'NEW_POST') {
        const currentNews = this.newsSubject.value;
        this.newsSubject.next([message.data, ...currentNews]);
      }
    });
  }

  getNews(userId: number): Observable<NewsPost[]> {
    return this.http.get<NewsPost[]>(`/api/news/${userId}`).pipe(
      tap(news => this.newsSubject.next(news))
    );
  }

  createPost(postData: { authorId: number; content: string; authorName?: string }): Observable<NewsPost> {
    return this.http.post<NewsPost>('/api/news', postData);
  }

  refreshNews(userId: number): void {
    this.getNews(userId).subscribe();
  }
}
