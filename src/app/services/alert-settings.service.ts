import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AlertSetting {
  id?: string;
  clientId: string;
  balanceBelow: {
    enabled: boolean;
    threshold?: number;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  largeTransaction: {
    enabled: boolean;
    threshold?: number;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  loginNewDevice: {
    enabled: boolean;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  suspiciousActivity: {
    enabled: boolean;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  newStatement: {
    enabled: boolean;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  paymentDue: {
    enabled: boolean;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  budgetExceeded: {
    enabled: boolean;
    threshold?: number;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
  savingsGoalReached: {
    enabled: boolean;
    channels: { email: boolean; sms: boolean; push: boolean; }
  };
}

@Injectable({
  providedIn: 'root'
})
export class AlertSettingsService {
  private apiUrl = 'http://localhost:8085/E-BANKING1/api/alerts';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les paramètres d'alerte d'un client
   */
  getClientAlertSettings(clientId: string): Observable<AlertSetting | null> {
    return this.http.get<AlertSetting>(`${this.apiUrl}/client/${clientId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching alert settings:', error);
          return of(null);
        })
      );
  }

  /**
   * Sauvegarder les paramètres d'alerte
   */
  saveAlertSettings(alertSettings: AlertSetting): Observable<AlertSetting> {
    return this.http.post<AlertSetting>(this.apiUrl, alertSettings, this.httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error saving alert settings:', error);
          throw error;
        })
      );
  }

  /**
   * Récupérer tous les paramètres d'alerte
   */
  getAllAlertSettings(): Observable<AlertSetting[]> {
    return this.http.get<AlertSetting[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching all alert settings:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupérer un paramètre d'alerte par ID
   */
  getAlertSettingById(id: string): Observable<AlertSetting | null> {
    return this.http.get<AlertSetting>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching alert setting by ID:', error);
          return of(null);
        })
      );
  }

  /**
   * Supprimer des paramètres d'alerte
   */
  deleteAlertSettings(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting alert settings:', error);
          throw error;
        })
      );
  }
}