import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User | null> {
    // В реальном приложении - запрос к API
    const mockUser: User = {
      id: 1,
      firstName: 'Иван',
      lastName: 'Иванов',
      email: 'ivan@mail.ru',
      role: 'admin', // Для демо - админ, чтобы видеть ссылку
      status: 'active',
      friends: [2, 3]
    };
    this.currentUserSubject.next(mockUser);
    return this.currentUserSubject.asObservable();
  }

  register(user: any): Observable<User> {
    return this.http.post<User>('/api/users/register', user);
  }

  // Метод для проверки доступа к админке
  canAccessAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }
}
