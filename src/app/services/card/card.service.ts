import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Card {
  id: string;
  cardNumber: string;
  maskedNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv?: string;
  type: 'debit' | 'credit';
  network: 'visa' | 'mastercard' | 'amex';
  status: 'active' | 'blocked' | 'expired' | 'pending';
  isContactless: boolean;
  onlinePaymentEnabled: boolean;
  internationalPaymentEnabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    accountNumber: string;
    balance: number;
    currency: string;
  };
}

export interface CardRequest {
  id?: string;
  clientId: string;
  accountId: string;
  cardType: 'debit' | 'credit';
  cardNetwork: 'visa' | 'mastercard' | 'amex';
  requestReason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  agentNotes?: string;
  clientName: string;
  clientEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = 'http://localhost:8085/E-BANKING1/api/cards';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les cartes
   */
  getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une carte par ID
   */
  getCardById(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cartes d'un compte
   */
  getCardsByAccountId(accountId: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/account/${accountId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cartes par type
   */
  getCardsByType(type: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/type/${type}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cartes par réseau
   */
  getCardsByNetwork(network: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/network/${network}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les cartes par nom du détenteur
   */
  getCardsByCardholderName(name: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/cardholder/${name}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crée une nouvelle carte
   */
  createCard(card: Partial<Card>): Observable<Card> {
    return this.http.post<Card>(this.apiUrl, card, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Active une carte
   */
  activateCard(cardId: string): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/${cardId}/activate`, {}, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Bloque une carte
   */
  blockCard(cardId: string, reason: string): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/${cardId}/block?reason=${encodeURIComponent(reason)}`, {}, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime une carte
   */
  deleteCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cardId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer une demande de carte
   */
  createCardRequest(request: Omit<CardRequest, 'id' | 'status' | 'requestDate'>): Observable<CardRequest> {
    const cardRequest: CardRequest = {
      ...request,
      status: 'pending',
      requestDate: new Date().toISOString()
    };

    // Simuler la création pour l'instant
    console.log('Card request created:', cardRequest);
    
    return of({
      ...cardRequest,
      id: this.generateId()
    });
  }

  /**
   * Récupérer les demandes d'un client
   */
  getClientCardRequests(clientId: string): Observable<CardRequest[]> {
    // Simuler des données pour l'instant
    const mockRequests: CardRequest[] = [];
    return of(mockRequests);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Carte non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('CardService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}