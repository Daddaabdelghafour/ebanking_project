import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Transfer, TransferFormData } from '../../shared/models/transfer.model';
import { ClientService } from '../client/client.service';
import { v4 as uuidv4 } from 'uuid'; // Vous devrez installer cette dépendance avec npm install uuid

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private mockTransfers: Transfer[] = [
    {
      id: 'tr1',
      senderAccountId: 'acc1',
      senderAccountNumber: '11223344556677',
      recipientAccountNumber: '9876543210',
      recipientName: 'Ahmed Tazi',
      amount: 1500,
      currency: 'MAD',
      reason: 'Remboursement',
      status: 'completed',
      executedDate: new Date('2023-05-10'),
      createdAt: new Date('2023-05-10'),
      reference: 'TRF20230510001',
      transactionFees: 0,
      type: 'domestic'
    },
    {
      id: 'tr2',
      senderAccountId: 'acc1',
      senderAccountNumber: '11223344556677',
      recipientAccountNumber: '77665544332211', // Compte d'épargne du même client
      recipientName: 'Mohammed El Amrani',
      amount: 5000,
      currency: 'MAD',
      reason: 'Épargne mensuelle',
      status: 'completed',
      executedDate: new Date('2023-05-01'),
      createdAt: new Date('2023-05-01'),
      reference: 'TRF20230501002',
      transactionFees: 0,
      type: 'internal'
    },
    {
      id: 'tr3',
      senderAccountId: 'acc1',
      senderAccountNumber: '11223344556677',
      recipientAccountNumber: 'FR7630006000011234567890189',
      recipientName: 'Jean Dupont',
      recipientBankCode: 'BNPAFRPP',
      amount: 2000,
      currency: 'EUR',
      reason: 'Paiement service',
      status: 'completed',
      executedDate: new Date('2023-04-15'),
      createdAt: new Date('2023-04-15'),
      reference: 'TRF20230415003',
      transactionFees: 25,
      type: 'international'
    },
    {
      id: 'tr4',
      senderAccountId: 'acc1',
      senderAccountNumber: '11223344556677',
      recipientAccountNumber: '5544332211',
      recipientName: 'Loubna Benali',
      amount: 750,
      currency: 'MAD',
      reason: 'Loyer',
      status: 'pending',
      scheduledDate: new Date('2023-05-28'),
      createdAt: new Date('2023-05-20'),
      reference: 'TRF20230520004',
      transactionFees: 0,
      isRecurring: true,
      recurringFrequency: 'monthly',
      type: 'domestic'
    }
  ];

  constructor(
    private http: HttpClient,
    private clientService: ClientService
  ) { }

  getTransfers(accountId: string): Observable<Transfer[]> {
    // Filter transfers by sender account ID
    const transfers = this.mockTransfers.filter(t => t.senderAccountId === accountId);
    return of(transfers).pipe(delay(800));
  }

  getTransferById(id: string): Observable<Transfer | undefined> {
    const transfer = this.mockTransfers.find(t => t.id === id);
    return of(transfer).pipe(delay(300));
  }

  createTransfer(transferData: TransferFormData): Observable<Transfer> {
    // Generate a new transfer
    const newTransfer: Transfer = {
      id: `tr${this.mockTransfers.length + 1}`,
      senderAccountId: transferData.senderAccountId,
      recipientAccountNumber: transferData.recipientAccountNumber,
      recipientName: transferData.recipientName,
      recipientBankCode: transferData.recipientBankCode,
      amount: transferData.amount,
      currency: transferData.currency,
      reason: transferData.reason,
      status: transferData.scheduledDate && transferData.scheduledDate > new Date() ? 'pending' : 'completed',
      scheduledDate: transferData.scheduledDate,
      executedDate: (!transferData.scheduledDate || transferData.scheduledDate <= new Date()) ? new Date() : undefined,
      createdAt: new Date(),
      reference: `TRF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${(this.mockTransfers.length + 1).toString().padStart(3, '0')}`,
      isRecurring: transferData.isRecurring,
      recurringFrequency: transferData.recurringFrequency,
      type: transferData.type
    };
    
    // Add transaction fees for international transfers
    if (transferData.type === 'international') {
      newTransfer.transactionFees = Math.round(transferData.amount * 0.015); // 1.5% fee
    } else {
      newTransfer.transactionFees = 0;
    }
    
    // Add the transfer to mock data
    this.mockTransfers.push(newTransfer);
    return of(newTransfer).pipe(delay(800));
  }

  cancelTransfer(id: string): Observable<boolean> {
    const index = this.mockTransfers.findIndex(t => t.id === id);
    if (index !== -1 && this.mockTransfers[index].status === 'pending') {
      this.mockTransfers[index].status = 'cancelled';
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(500));
  }

  // Utility methods
  getBanks(): Observable<{code: string, name: string}[]> {
    return of([
      { code: 'BMCEMAR', name: 'BMCE Bank' },
      { code: 'BCPOMAR', name: 'Banque Populaire' },
      { code: 'ATTIJARIMAROC', name: 'Attijariwafa Bank' },
      { code: 'SGMAROCCO', name: 'Société Générale Maroc' },
      { code: 'CIHMAROCCO', name: 'CIH Bank' },
      { code: 'CDBMAR', name: 'Crédit du Maroc' },
      { code: 'CAGRIMAR', name: 'Crédit Agricole du Maroc' },
      { code: 'BNPAFRPP', name: 'BNP Paribas (France)' },
      { code: 'DEUTDEFF', name: 'Deutsche Bank (Allemagne)' },
      { code: 'CHASUS33', name: 'JPMorgan Chase (USA)' },
      { code: 'BARCGB22', name: 'Barclays (UK)' }
    ]).pipe(delay(300));
  }

  getCurrencies(): Observable<string[]> {
    return of(['MAD', 'EUR', 'USD', 'GBP']).pipe(delay(300));
  }

  getTransferTypes(): Observable<{id: string, label: string}[]> {
    return of([
      { id: 'domestic', label: 'Virement national' },
      { id: 'international', label: 'Virement international' },
      { id: 'internal', label: 'Virement entre mes comptes' }
    ]).pipe(delay(300));
  }

  getRecurringFrequencies(): Observable<{id: string, label: string}[]> {
    return of([
      { id: 'daily', label: 'Quotidien' },
      { id: 'weekly', label: 'Hebdomadaire' },
      { id: 'monthly', label: 'Mensuel' },
      { id: 'quarterly', label: 'Trimestriel' },
      { id: 'annually', label: 'Annuel' }
    ]).pipe(delay(300));
  }
}