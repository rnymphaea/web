import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NewsPost } from '../models/news.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsSubject = new BehaviorSubject<NewsPost[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    // ✅ REAL-TIME ОБНОВЛЕНИЕ ЧЕРЕЗ WEBSOCKET
    this.wsService.getMessages().subscribe(message => {
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

  createPost(post: { authorId: number; content: string }): Observable<NewsPost> {
    return this.http.post<NewsPost>('/api/news', post);
  }

  getNewsStream(): Observable<NewsPost[]> {
    return this.newsSubject.asObservable();
  }
}
