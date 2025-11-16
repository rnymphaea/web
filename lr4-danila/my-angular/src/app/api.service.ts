import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

export interface User {
    id: number,
    firstName: string,
    middleName: string,
    lastName: string,
    birthday: Date,
    email: string,
    role: string,
    status: string,
    listOfFriends: Array<number>
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    login(email: string): Observable<{user: User}> {
        return this.http.post<{user: User}>(`${this.apiUrl}/loginUser`, { email })
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        );
    }

    registration(data: any): Observable<{user: User}> {
        return this.http.post<{user: User}>(`${this.apiUrl}/registrationUser`, { data })
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        );
    }

    getUserById(id: number): Observable<{user: User}> {
        return this.http.get<{user: User}>(`${this.apiUrl}/user/${id}`)
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        );
    }

    sendPhoto(id: number, file: File){
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', id.toString());
        
        return this.http.post(`${this.apiUrl}/addPhoto`, formData)
            .pipe(
                map(response => {
                    return response;
                }),
                catchError(this.handleError)
            );
    }

    getUserPhoto(userId: number): string {
        return `${this.apiUrl}/photos/${userId}`;
    }

    deleteFriend(userId: number, friendId: number){
        return this.http.post(`${this.apiUrl}/deleteFriend`, { userId, friendId })
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        );
    }

    addFriend(userId: number, friendId: number){
        return this.http.post(`${this.apiUrl}/addFriend`, { userId, friendId })
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        );
    }

    getFriends(user: User): Observable<{friends: User[]}> {
        return this.http.get<{friends: User[]}>(`${this.apiUrl}/getFiends/${user.id}`,)
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        )
    }

    getUsers(user: User): Observable<{users: User[]}> {
        return this.http.get<{users: User[]}>(`${this.apiUrl}/getUsers/${user.id}`,)
        .pipe(
            map(response => {
                return response;
            }),
            catchError(this.handleError)
        )
    }

    toAdmin(){
        window.open("https://localhost:8443/");
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Произошла ошибка';

        if (error.error instanceof ErrorEvent) {
            errorMessage = `Ошибка: ${error.error.message}`;
        } else {
            errorMessage = `Код ошибки: ${error.status}\nСообщение: ${error.message}`;
        
        switch (error.status) {
            case 400:
            errorMessage = 'Неверный запрос';
            break;
            case 401:
            errorMessage = 'Неавторизован';
            break;
            case 403:
            errorMessage = 'Доступ запрещен';
            break;
            case 404:
            errorMessage = 'Ресурс не найден';
            break;
            case 409:
            errorMessage = 'Пользователь существует';
            break;
            case 500:
            errorMessage = 'Ошибка сервера';
            break;
        }
        }

        console.log(errorMessage);

        return throwError(() => error);
    }
}