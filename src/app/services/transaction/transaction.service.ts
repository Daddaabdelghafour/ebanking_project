// filepath: c:\Users\dadda\Desktop\Ebanking_Project\e-banking-app\src\app\services\transaction\transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Transaction, TransactionSummary } from '../../shared/models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  // Obtenir les transactions pour le tableau de bord
  getDashboardTransactions(clientId: string, limit: number = 5): Observable<Transaction[]> {
    // Dans une application réelle, appel API
    // return this.http.get<Transaction[]>(`${this.apiUrl}/dashboard/${clientId}?limit=${limit}`);
    
    // Pour le développement, mockée
    return of(this.getMockTransactions().slice(0, limit));
  }

  // Obtenir toutes les transactions d'un compte
  getAccountTransactions(accountId: string, filters?: any): Observable<Transaction[]> {
    // Pour l'instant, retourner les mêmes données mockées
    return of(this.getMockTransactions());
  }

  // Obtenir le résumé des transactions d'un client
  getTransactionSummary(clientId: string, period: string = 'month'): Observable<TransactionSummary> {
    // Implémenter résumé des transactions
    return of({
      totalIncoming: 20000,
      totalOutgoing: 12500,
      netChange: 7500,
      currency: 'MAD',
      periodStart: new Date(new Date().setDate(1)),
      periodEnd: new Date(),
      categorySummary: [
        { category: 'housing', amount: 5000, percentage: 40 },
        { category: 'food', amount: 2500, percentage: 20 },
        { category: 'entertainment', amount: 1500, percentage: 12 },
        { category: 'utilities', amount: 2000, percentage: 16 },
        { category: 'other', amount: 1500, percentage: 12 }
      ]
    });
  }

  private getMockTransactions(): Transaction[] {
    return [
      {
        id: 'tx1',
        accountId: 'acc1',
        name: 'Carrefour Market',
        type: 'payment',
        date: new Date(2023, 4, 15),
        category: 'shopping',
        amount: -450.75,
        currency: 'MAD',
        status: 'completed',
        merchantName: 'Carrefour Market',
        reference: 'TXN-2023051500001',
        balanceAfterTransaction: 24050
      },
      {
        id: 'tx2',
        accountId: 'acc1',
        name: 'Salaire Mensuel',
        type: 'deposit',
        date: new Date(2023, 4, 5),
        category: 'finance',
        amount: 15000,
        currency: 'MAD',
        status: 'completed',
        description: 'Versement salaire',
        reference: 'SAL-202305',
        balanceAfterTransaction: 35000
      },
      // Ajouter plus de transactions mockées...
    ];
  }
}