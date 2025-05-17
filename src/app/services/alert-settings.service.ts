import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertSettings , AlertPreference , AlertType } from '../shared/models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertSettingsService {
  private apiUrl = '/api/alert-settings';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les paramètres d'alerte de l'utilisateur
   */
  getAlertSettings(): Observable<AlertSettings> {
    return of(this.getMockAlertSettings()).pipe(
      catchError(this.handleError)
    );

    // return this.http.get<AlertSettings>(this.apiUrl).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Met à jour les paramètres d'alerte de l'utilisateur
   */
  updateAlertSettings(settings: Partial<AlertSettings>): Observable<AlertSettings> {
    // Simuler une mise à jour réussie
    const mockSettings = this.getMockAlertSettings();
    const updatedSettings = { ...mockSettings, ...settings };
    return of(updatedSettings).pipe(catchError(this.handleError));

    // return this.http.put<AlertSettings>(this.apiUrl, settings).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Active ou désactive un type d'alerte spécifique
   */
  toggleAlertType(type: AlertType, enabled: boolean): Observable<AlertSettings> {
    // Simuler une mise à jour réussie
    return of(this.getMockAlertSettings()).pipe(catchError(this.handleError));

    // return this.http.patch<AlertSettings>(`${this.apiUrl}/toggle`, { type, enabled }).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Met à jour le seuil pour un type d'alerte
   */
  updateAlertThreshold(type: AlertType, threshold: number): Observable<AlertSettings> {
    // Simuler une mise à jour réussie
    return of(this.getMockAlertSettings()).pipe(catchError(this.handleError));

    // return this.http.patch<AlertSettings>(`${this.apiUrl}/threshold`, { type, threshold }).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Met à jour les canaux de notification pour un type d'alerte
   */
  updateAlertChannels(type: AlertType, email: boolean, sms: boolean, push: boolean): Observable<AlertSettings> {
    // Simuler une mise à jour réussie
    return of(this.getMockAlertSettings()).pipe(catchError(this.handleError));

    // return this.http.patch<AlertSettings>(`${this.apiUrl}/channels`, { type, email, sms, push }).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Obtient des préférences d'alerte formatées pour l'interface utilisateur
   */
  getAlertPreferences(): Observable<AlertPreference[]> {
    return of(this.getMockAlertPreferences()).pipe(catchError(this.handleError));

    // return this.http.get<AlertPreference[]>(`${this.apiUrl}/preferences`).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur est survenue', error);
    
    // Log détaillé pour débogage
    if (error.error instanceof ErrorEvent) {
      console.error('Erreur côté client:', error.error.message);
    } else {
      console.error(`Erreur serveur: ${error.status}, message: ${error.message}`);
      console.error('Corps de la réponse:', error.error);
    }
    
    return throwError(() => new Error('Une erreur est survenue lors de l\'opération. Veuillez réessayer plus tard.'));
  }

  /**
   * Données mockées pour les paramètres d'alerte
   */
  private getMockAlertSettings(): AlertSettings {
    return {
      id: 'als1',
      clientId: 'client1',
      balanceBelow: 1000,
      largeTransactions: 5000,
      loginNewDevice: true,
      suspiciousActivity: true,
      newStatement: true,
      paymentDue: true,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-04-15')
    };
  }

  /**
   * Données mockées pour les préférences d'alerte
   */
  private getMockAlertPreferences(): AlertPreference[] {
    return [
      {
        type: 'balance_below',
        description: 'Alerte de solde bas',
        enabled: true,
        threshold: 1000,
        channels: {
          email: true,
          sms: true,
          push: false
        }
      },
      {
        type: 'large_transaction',
        description: 'Transactions importantes',
        enabled: true,
        threshold: 5000,
        channels: {
          email: true,
          sms: true,
          push: false
        }
      },
      {
        type: 'login_new_device',
        description: 'Connexion depuis un nouvel appareil',
        enabled: true,
        channels: {
          email: true,
          sms: true,
          push: false
        }
      },
      {
        type: 'suspicious_activity',
        description: 'Activité suspecte',
        enabled: true,
        channels: {
          email: true,
          sms: true,
          push: false
        }
      },
      {
        type: 'new_statement',
        description: 'Nouveau relevé disponible',
        enabled: true,
        channels: {
          email: true,
          sms: false,
          push: false
        }
      },
      {
        type: 'payment_due',
        description: 'Échéance de paiement',
        enabled: true,
        channels: {
          email: true,
          sms: false,
          push: false
        }
      }
    ];
  }
}