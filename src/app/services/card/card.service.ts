import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Card, CardRequest } from '../../shared/models/card.model';
import { Account } from '../../shared/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = "/api/cards"; // URL de l'API conforme au backend

  // Données de simulation pour le développement
  private mockCards: Card[] = [
    {
      id: 'card1',
      accountId: 'acc1',
      type: 'debit',
      network: 'visa',
      cardholderName: 'JOHN DOE',
      maskedNumber: '4539 **** **** 5678',
      expiryMonth: '12',
      expiryYear: '25',
      status: 'active',
      isContactless: true,
      dailyLimit: 1000,
      monthlyLimit: 20000,
      onlinePaymentEnabled: true,
      internationalPaymentEnabled: false,
      createdAt: '2022-01-15T00:00:00Z',
      updatedAt: '2022-01-15T00:00:00Z'
    },
    {
      id: 'card2',
      accountId: 'acc2',
      type: 'credit',
      network: 'mastercard',
      cardholderName: 'JOHN DOE',
      maskedNumber: '5412 **** **** 3456',
      expiryMonth: '06',
      expiryYear: '27',
      status: 'active',
      isContactless: true,
      dailyLimit: 2500,
      monthlyLimit: 50000,
      onlinePaymentEnabled: true,
      internationalPaymentEnabled: true,
      createdAt: '2022-03-10T00:00:00Z',
      updatedAt: '2022-03-10T00:00:00Z'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Formate une date en chaîne ISO
   */
  private formatDate(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return date;
  }

  /**
   * Formate un objet contenant des dates
   */
  private formatDates<T>(obj: T): T {
    if (!obj) return obj;
    
    const formatted = { ...obj } as any;
    
    // Parcourir toutes les propriétés pour trouver les dates et les formatter
    for (const key in formatted) {
      if (formatted[key] instanceof Date) {
        formatted[key] = this.formatDate(formatted[key]);
      } else if (typeof formatted[key] === 'object' && formatted[key] !== null) {
        formatted[key] = this.formatDates(formatted[key]);
      }
    }
    
    return formatted as T;
  }

  /**
   * Récupérer toutes les cartes
   */
  getAllCards(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}`).pipe(
      catchError(() => of(this.mockCards))
    );
  }
  
  /**
   * Récupérer une carte par ID
   */
  getCardById(cardId: string): Observable<Card | undefined> {
    return this.http.get<Card>(`${this.apiUrl}/${cardId}`).pipe(
      catchError(() => {
        const card = this.mockCards.find(c => c.id === cardId);
        return of(card);
      })
    );
  }
  
  /**
   * Créer une nouvelle carte
   */
  createCard(card: Partial<Card>): Observable<Card> {
    const formattedCard = this.formatDates(card);
    
    return this.http.post<Card>(`${this.apiUrl}`, formattedCard).pipe(
      catchError(() => {
        const now = new Date().toISOString();
        const newCard: Card = {
          id: `card-${Date.now()}`,
          ...formattedCard as any,
          createdAt: now,
          updatedAt: now
        };
        this.mockCards.push(newCard);
        return of(newCard);
      })
    );
  }
  
  /**
   * Supprimer une carte
   */
  deleteCard(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cardId}`).pipe(
      catchError(() => {
        const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
        if (cardIndex >= 0) {
          this.mockCards.splice(cardIndex, 1);
        }
        return of(undefined);
      })
    );
  }
  
  /**
   * Trouver les cartes par compte
   */
  getCardsByAccount(account: Account): Observable<Card[]> {
    const formattedAccount = this.formatDates(account);
    
    return this.http.post<Card[]>(`${this.apiUrl}/account`, formattedAccount).pipe(
      catchError(() => {
        // Filtrer par accountId dans les données mockées
        const filteredCards = this.mockCards.filter(card => card.accountId === account.id);
        return of(filteredCards);
      })
    );
  }
  
  /**
   * Trouver les cartes par compte et statut
   */
  getCardsByAccountAndStatus(account: Account, status: string): Observable<Card[]> {
    const params = new HttpParams().set('status', status);
    const formattedAccount = this.formatDates(account);
    
    return this.http.post<Card[]>(`${this.apiUrl}/account/status`, formattedAccount, { params }).pipe(
      catchError(() => {
        // Filtrer par accountId et status dans les données mockées
        const filteredCards = this.mockCards.filter(
          card => card.accountId === account.id && card.status === status
        );
        return of(filteredCards);
      })
    );
  }
  
  /**
   * Trouver les cartes par type
   */
  getCardsByType(type: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/type/${type}`).pipe(
      catchError(() => {
        const filteredCards = this.mockCards.filter(card => card.type === type);
        return of(filteredCards);
      })
    );
  }
  
  /**
   * Trouver les cartes par réseau
   */
  getCardsByNetwork(network: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/network/${network}`).pipe(
      catchError(() => {
        const filteredCards = this.mockCards.filter(card => card.network === network);
        return of(filteredCards);
      })
    );
  }
  
  /**
   * Trouver les cartes par nom du titulaire
   */
  getCardsByCardholderName(name: string): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/cardholder/${name}`).pipe(
      catchError(() => {
        const filteredCards = this.mockCards.filter(
          card => card.cardholderName.toLowerCase().includes(name.toLowerCase())
        );
        return of(filteredCards);
      })
    );
  }
  
  /**
   * Activer une carte
   */
  activateCard(cardId: string): Observable<Card> {
    return this.http.put<Card>(`${this.apiUrl}/${cardId}/activate`, {}).pipe(
      catchError(() => {
        const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
        if (cardIndex >= 0) {
          this.mockCards[cardIndex].status = 'active';
          this.mockCards[cardIndex].updatedAt = new Date().toISOString();
          return of(this.mockCards[cardIndex]);
        }
        return throwError(() => new Error('Card not found'));
      })
    );
  }
  
  /**
   * Bloquer une carte
   */
  blockCard(cardId: string, reason: string): Observable<Card> {
    const params = new HttpParams().set('reason', reason);
    
    return this.http.put<Card>(`${this.apiUrl}/${cardId}/block`, {}, { params }).pipe(
      catchError(() => {
        const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
        if (cardIndex >= 0) {
          this.mockCards[cardIndex].status = 'blocked';
          this.mockCards[cardIndex].updatedAt = new Date().toISOString();
          return of(this.mockCards[cardIndex]);
        }
        return throwError(() => new Error('Card not found'));
      })
    );
  }
  
  /**
   * Méthode utilitaire pour les cartes par client (peut être implémentée via account)
   */
  getCardsByClientId(clientId: string): Observable<Card[]> {
    // Cette méthode n'est pas directement exposée par le backend
    // On peut simuler son comportement pour la compatibilité
    return of(this.mockCards);
  }
  
  /**
   * Méthode utilitaire pour les cartes par ID de compte
   */
  getCardsByAccountId(accountId: string): Observable<Card[]> {
    // Simuler le comportement en utilisant un objet Account minimal
    const account = { id: accountId } as Account;
    return this.getCardsByAccount(account);
  }

  /**
   * Demander une nouvelle carte (méthode utilitaire)
   */
  requestNewCard(request: Omit<CardRequest, 'id' | 'requestDate' | 'status' | 'createdAt' | 'updatedAt'>): Observable<CardRequest> {
    // Cette fonctionnalité peut être implémentée via createCard avec adaptation
    const now = new Date().toISOString();
    const newRequest: CardRequest = {
      id: `req-${Date.now()}`,
      ...request,
      requestDate: now,
      status: 'pending',
      createdAt: now,
    };
    
    return of(newRequest);
  }

  /**
   * Mettre à jour les paramètres d'une carte (méthode utilitaire)
   */
  updateCardSettings(cardId: string, settings: Partial<Card>): Observable<Card> {
    const formattedSettings = this.formatDates(settings);
    
    // Cette fonctionnalité n'est pas directement exposée par le backend
    // On peut la simuler pour maintenir la compatibilité
    const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      this.mockCards[cardIndex] = { 
        ...this.mockCards[cardIndex], 
        ...formattedSettings,
        updatedAt: new Date().toISOString()
      };
      return of(this.mockCards[cardIndex]);
    }
    return throwError(() => new Error('Card not found'));
  }

  // Méthodes utilitaires pour l'affichage
  formatCardNumber(number: string): string {
    return number.replace(/\s/g, ' ');
  }

  getExpiryDate(month: string, year: string): string {
    return `${month}/${year}`;
  }
}