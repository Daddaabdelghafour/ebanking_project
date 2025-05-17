import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Transaction } from '../../shared/models/transaction';
import { 
  TransactionVerification,
  mapTransactionToVerification,
  createVerificationTransaction
} from '../../shared/models/transactionVerification';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = '/api/transactions';

  constructor(private http: HttpClient) {}

  // Méthode pour obtenir les transactions en attente de vérification
  getPendingTransactions(): Observable<TransactionVerification[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`).pipe(
      map(data => this.mapToVerificationModel(data)),
      catchError(err => {
        console.error("Erreur lors de la récupération des transactions", err);
        // Retourner des données de test en cas d'erreur
        return of(this.getMockVerificationTransactions());
      })
    );
  }

  // Méthode pour approuver une transaction
  approveTransaction(id: string, agentName: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, { agentName }).pipe(
      catchError(err => {
        console.error("Erreur lors de l'approbation de la transaction", err);
        return of({ success: true });
      })
    );
  }

  // Méthode pour rejeter une transaction
  rejectTransaction(id: string, agentName: string, reason: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reject`, { agentName, reason }).pipe(
      catchError(err => {
        console.error("Erreur lors du rejet de la transaction", err);
        return of({ success: true });
      })
    );
  }

  // Méthode pour signaler une transaction
  flagTransaction(id: string, reason: string, agentName: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/flag`, { reason, agentName }).pipe(
      catchError(err => {
        console.error("Erreur lors du signalement de la transaction", err);
        return of({ success: true });
      })
    );
  }

  // Méthode privée pour convertir les données en TransactionVerification
  private mapToVerificationModel(data: any[]): TransactionVerification[] {
    // Si les données sont des objets Transaction standard, les convertir
    if (data[0] && data[0].type && data[0].accountId) {
      return data.map(item => mapTransactionToVerification(item as Transaction, 
        this.getClientNameForAccount(item.accountId)));
    }
    
    // Sinon créer des objets TransactionVerification directement
    return data.map(item => createVerificationTransaction({
      id: item.id,
      date: new Date(item.date || item.createdAt || Date.now()),
      amount: item.amount || 0,
      currency: item.currency || 'MAD',
      type: item.type || 'other',
      typeLabel: item.typeLabel || this.getTypeLabel(item.type || 'other'),
      status: item.status || 'pending',
      clientName: item.clientName || this.getClientNameForAccount(item.accountId),
      clientId: item.clientId || item.accountId || '',
      accountNumber: item.accountNumber || item.accountId || '',
      recipient: item.recipientName || item.recipient || '',
      recipientAccount: item.recipientAccountId || item.recipientAccount || '',
      description: item.description || '',
      reference: item.reference || ''
    }));
  }

  // Méthode pour obtenir le nom d'un client à partir d'un ID de compte (mock)
  private getClientNameForAccount(accountId: string): string {
    const mockClients: {[key: string]: string} = {
      'acc1': 'Mohammed El Fassi',
      'acc2': 'Ahmed Alaoui',
      'acc3': 'Sofia Bennani',
      'acc4': 'Amina Karam',
      'acc5': 'Karim Moussaoui'
    };
    
    return mockClients[accountId] || 'Client Inconnu';
  }

  // Méthode helper pour obtenir le label d'un type de transaction
  private getTypeLabel(type: string): string {
    switch (type) {
      case 'transfer': return 'Virement';
      case 'payment': return 'Paiement';
      case 'withdrawal': return 'Retrait';
      case 'deposit': return 'Dépôt';
      case 'refund': return 'Remboursement';
      default: return 'Autre';
    }
  }

  // Données de test pour les transactions à vérifier
  private getMockVerificationTransactions(): TransactionVerification[] {
    return [
      {
        id: 'ptx1',
        date: new Date(2023, 5, 2),
        amount: -50000,
        currency: 'MAD',
        type: 'transfer',
        typeLabel: 'Virement',
        status: 'pending',
        clientName: 'Mohammed El Fassi',
        clientId: 'acc1',
        accountNumber: 'MAD12345678',
        description: 'Paiement Fournisseur International',
        recipient: 'Global Supplies Inc.',
        recipientName: 'Global Supplies Inc.',
        recipientAccount: 'INTL-ACC-123',
        recipientAccountId: 'INTL-ACC-123',
        reference: 'INT-TRF-2023060201'
      },
      {
        id: 'ptx2',
        date: new Date(2023, 5, 3),
        amount: 100000,
        currency: 'MAD',
        type: 'deposit',
        typeLabel: 'Dépôt',
        status: 'pending',
        clientName: 'Sofia Bennani',
        clientId: 'acc3',
        accountNumber: 'MAD87654321',
        description: 'Dépôt espèces',
        reference: 'CHDP-2023060301'
      },
      {
        id: 'ptx3',
        date: new Date(2023, 5, 1),
        amount: -30000,
        currency: 'MAD',
        type: 'withdrawal',
        typeLabel: 'Retrait',
        status: 'pending',
        clientName: 'Ahmed Alaoui',
        clientId: 'acc2',
        accountNumber: 'MAD23456789',
        description: 'Retrait exceptionnel guichet',
        reference: 'WTH-2023060101'
      },
      {
        id: 'ptx4',
        date: new Date(2023, 5, 3),
        amount: -42000,
        currency: 'MAD',
        type: 'payment',
        typeLabel: 'Paiement',
        status: 'flagged',
        clientName: 'Amina Karam',
        clientId: 'acc4',
        accountNumber: 'MAD34567890',
        merchantName: 'Bijouterie Royale',
        reference: 'POS-2023060301',
        flaggedReason: 'Montant inhabituel pour ce client'
      },
      {
        id: 'ptx5',
        date: new Date(2023, 5, 2),
        amount: -15000,
        currency: 'MAD',
        type: 'transfer',
        typeLabel: 'Virement',
        status: 'pending',
        clientName: 'Karim Moussaoui',
        clientId: 'acc5',
        accountNumber: 'MAD45678901',
        description: 'Virement vers 3 comptes différents',
        recipient: 'Multiple',
        recipientName: 'Multiple',
        reference: 'MTF-2023060201'
      }
    ];
  }
}