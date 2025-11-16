import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked' | 'unconfirmed';
  friends: number[];
  avatar?: string;
  birthDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Базовый URL для API
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((user: any) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, user).pipe(
      tap((newUser: any) => {
        this.currentUserSubject.next(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
      })
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  canAccessAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  getFriends(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/friends/${userId}`);
  }

  getMessages(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/messages/${userId}`);
  }
}
