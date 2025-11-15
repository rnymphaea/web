import { ErrorHandler, Injectable } from '@angular/core';
import { ErrorLoggerService } from './error-logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private errorLogger: ErrorLoggerService) {}

  handleError(error: any) {
    this.errorLogger.logError(error);
  }
}
