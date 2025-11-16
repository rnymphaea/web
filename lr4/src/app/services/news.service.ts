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
  authorAvatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private newsSubject = new BehaviorSubject<NewsPost[]>([]);
  public news$ = this.newsSubject.asObservable();
  
  // Базовый URL для API на порту 3001
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    this.wsService.getMessages().subscribe((message: any) => {
      if (message.type === 'NEW_POST') {
        const currentNews = this.newsSubject.value;
        this.newsSubject.next([message.data, ...currentNews]);
      }
    });
  }

  getNews(userId: number): Observable<NewsPost[]> {
    return this.http.get<NewsPost[]>(`${this.apiUrl}/news/${userId}`, {
      withCredentials: true
    }).pipe(
      tap(news => this.newsSubject.next(news))
    );
  }

  createPost(postData: { authorId: number; content: string; }): Observable<NewsPost> {
    return this.http.post<NewsPost>(`${this.apiUrl}/news`, postData, {
      withCredentials: true
    });
  }

  refreshNews(userId: number): void {
    this.getNews(userId).subscribe();
  }

  // Метод для получения всех новостей (для админки)
  getAllNews(): Observable<NewsPost[]> {
    return this.http.get<NewsPost[]>(`${this.apiUrl}/news`, {
      withCredentials: true
    });
  }
}
