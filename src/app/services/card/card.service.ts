import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Card, CardRequest } from '../../shared/models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = "/api/v1/cards"; // URL de l'API

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
      createdAt: new Date('2022-01-15')
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
      createdAt: new Date('2022-03-10')
    }
  ];

  constructor(private http: HttpClient) {}

  getCardsByClientId(clientId: string): Observable<Card[]> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.get<Card[]>(`${this.apiUrl}/clients/${clientId}/cards`);
    
    // Pour le développement, utilisez les données de simulation
    return of(this.mockCards);
  }

  getCardsByAccountId(accountId: string): Observable<Card[]> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.get<Card[]>(`${this.apiUrl}/accounts/${accountId}/cards`);
    
    // Pour le développement, filtrez les cartes simulées par ID de compte
    const filteredCards = this.mockCards.filter(card => card.accountId === accountId);
    return of(filteredCards);
  }

  getCardById(cardId: string): Observable<Card | undefined> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.get<Card>(`${this.apiUrl}/cards/${cardId}`);
    
    // Pour le développement, recherchez dans les données simulées
    const card = this.mockCards.find(c => c.id === cardId);
    return of(card);
  }

  requestNewCard(request: Omit<CardRequest, 'id' | 'requestDate' | 'status' | 'createdAt' | 'updatedAt'>): Observable<CardRequest> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.post<CardRequest>(`${this.apiUrl}/card-requests`, request);
    
    // Pour le développement, simulez une réponse
    const newRequest: CardRequest = {
      id: `req-${Date.now()}`,
      ...request,
      requestDate: new Date(),
      status: 'pending',
      createdAt: new Date(),
    };
    
    return of(newRequest);
  }

  blockCard(cardId: string): Observable<Card> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.patch<Card>(`${this.apiUrl}/cards/${cardId}/block`, {});
    
    // Pour le développement, mettre à jour localement
    const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      this.mockCards[cardIndex].status = 'blocked';
      this.mockCards[cardIndex].updatedAt = new Date();
    }
    return of(this.mockCards[cardIndex]);
  }

  updateCardSettings(cardId: string, settings: Partial<Card>): Observable<Card> {
    // En environnement de production, utilisez le service HTTP
    // return this.http.patch<Card>(`${this.apiUrl}/cards/${cardId}`, settings);
    
    // Pour le développement, mettre à jour localement
    const cardIndex = this.mockCards.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      this.mockCards[cardIndex] = { 
        ...this.mockCards[cardIndex], 
        ...settings,
        updatedAt: new Date() 
      };
    }
    return of(this.mockCards[cardIndex]);
  }

  // Format de la carte pour l'affichage
  formatCardNumber(number: string): string {
    return number.replace(/\s/g, ' ');
  }

  getExpiryDate(month: string, year: string): string {
    return `${month}/${year}`;
  }
}