import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  
  // Ajouter le token d'authentification si disponible
  //const token = authService.getToken();
  /*
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  */ 
  // Continuer avec la requête modifiée
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gérer les erreurs 401 (non autorisé)
      if (error.status === 401) {
        
      }
      
      // Propager l'erreur
      return throwError(() => error);
    })
  );
};