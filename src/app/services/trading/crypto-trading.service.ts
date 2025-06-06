import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TradeRequest {
  clientId: string;
  symbol: string;
  quantity: number;
}

export interface BackendCryptoTransaction {
  id: string;
  clientId: string;
  symbol: string;
  orderId: string;
  quantity: number;
  price: number;
  side: 'BUY' | 'SELL';
  status: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoTradingService {
  private apiUrl = 'http://localhost:8085/Binance_war_exploded/api/trading';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Test API connectivity
   */
  testConnection(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/test`, { responseType: 'text' as 'json' })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Execute buy order
   */
  buyAsset(request: TradeRequest): Observable<any> {
    console.log('🚀 Sending buy request:', request);
    return this.http.post<any>(`${this.apiUrl}/buy`, request, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Execute sell order
   */
  sellAsset(request: TradeRequest): Observable<any> {
    console.log('🚀 Sending sell request:', request);
    return this.http.post<any>(`${this.apiUrl}/sell`, request, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get all transactions for a client
   */
  getClientTransactions(clientId: string): Observable<BackendCryptoTransaction[]> {
    console.log('📊 Fetching transactions for client:', clientId);
    return this.http.get<BackendCryptoTransaction[]>(`${this.apiUrl}/transactions/client/${clientId}`)
      .pipe(
        map(transactions => {
          console.log('✅ Received transactions:', transactions);
          return transactions || [];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get all transactions (admin function)
   */
  getAllTransactions(): Observable<BackendCryptoTransaction[]> {
    return this.http.get<BackendCryptoTransaction[]>(`${this.apiUrl}/transactions`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get specific transaction by ID
   */
  getTransactionById(transactionId: string): Observable<BackendCryptoTransaction> {
    return this.http.get<BackendCryptoTransaction>(`${this.apiUrl}/transactions/${transactionId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Error handling
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      // Server-side error
      console.error('Backend Error Details:', {
        status: error.status,
        message: error.message,
        url: error.url,
        error: error.error
      });

      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur http://localhost:8085';
          break;
        case 400:
          errorMessage = 'Requête invalide - Vérifiez les paramètres de trading';
          break;
        case 401:
          errorMessage = 'Non autorisé - Vérifiez vos identifiants Binance';
          break;
        case 403:
          errorMessage = 'Accès interdit - Permissions insuffisantes';
          break;
        case 404:
          errorMessage = 'Service non trouvé - Vérifiez l\'URL du backend';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne - Problème avec l\'API Binance ou la base de données';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('🚨 Trading API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}