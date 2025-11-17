import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Attach Firebase ID token if available (async)
  const token$ = from(authService.getIdToken());

  return token$.pipe(
    switchMap((token) => {
      let cloned = req;
      if (token) {
        cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      return next(cloned);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Could add refresh logic or redirect to login
      }
      return throwError(() => error);
    })
  );
};