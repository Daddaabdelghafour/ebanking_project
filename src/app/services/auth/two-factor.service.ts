import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthResponse, VerificationRequest } from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class TwoFactorService {
  private apiUrl = `/auth/2fa`;

  constructor(private http: HttpClient) {}

  // Vérifier un code reçu par SMS
  verifyCode(verificationRequest: VerificationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify`, verificationRequest)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la vérification du code', error);
          return throwError(() => new Error(error.message || 'Code de vérification invalide'));
        })
      );
  }

  // Demander le renvoi d'un code SMS
  resendCode(sessionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/resend`,
      { sessionId }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du renvoi du code', error);
        return throwError(() => new Error(error.message || 'Impossible d\'envoyer un nouveau code'));
      })
    );
  }

  // Vérifier si le numéro de téléphone est valide
  validatePhoneNumber(phoneNumber: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/validate-phone`,
      { phoneNumber }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la validation du numéro de téléphone', error);
        return throwError(() => new Error(error.message || 'Numéro de téléphone invalide'));
      })
    );
  }

  // Envoyer un code de test pour valider la configuration 2FA
  sendTestCode(phoneNumber: string): Observable<{ success: boolean; message: string; sessionId?: string }> {
    return this.http.post<{ success: boolean; message: string; sessionId?: string }>(
      `${this.apiUrl}/send-test-code`,
      { phoneNumber }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'envoi du code de test', error);
        return throwError(() => new Error(error.message || 'Impossible d\'envoyer le code de test'));
      })
    );
  }
}