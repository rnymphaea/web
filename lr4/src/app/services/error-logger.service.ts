import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggerService {
  private errors: any[] = [];

  constructor(private http: HttpClient) {}

  logError(error: any) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      url: window.location.href
    };
    
    this.errors.push(errorEntry);
    console.error('Application Error:', errorEntry);
    
    localStorage.setItem('app_errors', JSON.stringify(this.errors));
  }

  getErrors() {
    return this.errors;
  }
}
