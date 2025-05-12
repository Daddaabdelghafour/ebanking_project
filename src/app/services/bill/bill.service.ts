import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Bill, BillPayment, RechargeProvider, Recharge, BillFormData, RechargeFormData } from '../../shared/models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private apiUrl = `/bills`;
  
  // DONNÉES FICTIVES pour le développement
  private mockBills: Bill[] = [
    {
      id: 'bill1',
      clientId: 'client1',
      providerId: 'prov1',
      providerName: 'Maroc Telecom',
      referenceNumber: '0661234567',
      amount: 199.99,
      currency: 'MAD',
      dueDate: new Date(2023, 5, 15),
      isPaid: false,
      isRecurring: true,
      recurringFrequency: 'monthly',
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(2023, 4, 30),
      notificationEnabled: true,
      billCategory: 'telecom',
      logo: 'assets/images/providers/maroc-telecom.png'
    },
    {
      id: 'bill2',
      clientId: 'client1',
      providerId: 'prov2',
      providerName: 'LYDEC',
      referenceNumber: 'LYD-12345678',
      amount: 450.75,
      currency: 'MAD',
      dueDate: new Date(2023, 5, 20),
      isPaid: false,
      isRecurring: true,
      recurringFrequency: 'monthly',
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(2023, 5, 1),
      notificationEnabled: true,
      billCategory: 'utility',
      logo: 'assets/images/providers/lydec.png'
    },
    {
      id: 'bill3',
      clientId: 'client1',
      providerId: 'prov3',
      providerName: 'Netflix',
      referenceNumber: 'NF-87654321',
      amount: 95.00,
      currency: 'MAD',
      dueDate: new Date(2023, 5, 10),
      isPaid: true,
      isRecurring: true,
      recurringFrequency: 'monthly',
      status: 'paid',
      paidAmount: 95.00,
      paidDate: new Date(2023, 5, 9),
      createdAt: new Date(2023, 5, 1),
      notificationEnabled: false,
      billCategory: 'streaming',
      logo: 'assets/images/providers/netflix.png'
    }
  ];

  private mockRechargeProviders: RechargeProvider[] = [
    {
      id: 'prov1',
      name: 'Maroc Telecom',
      serviceType: 'mobile',
      logoUrl: 'assets/images/providers/maroc-telecom.png',
      isActive: true,
      feePercentage: 0,
      createdAt: new Date(2023, 1, 1)
    },
    {
      id: 'prov4',
      name: 'Orange',
      serviceType: 'mobile',
      logoUrl: 'assets/images/providers/orange.png',
      isActive: true,
      feePercentage: 0,
      createdAt: new Date(2023, 1, 1)
    },
    {
      id: 'prov5',
      name: 'Inwi',
      serviceType: 'mobile',
      logoUrl: 'assets/images/providers/inwi.png',
      isActive: true,
      feePercentage: 0,
      createdAt: new Date(2023, 1, 1)
    },
    {
      id: 'prov3',
      name: 'Netflix',
      serviceType: 'streaming',
      logoUrl: 'assets/images/providers/netflix.png',
      isActive: true,
      feePercentage: 0,
      createdAt: new Date(2023, 1, 1)
    },
    {
      id: 'prov6',
      name: 'Spotify',
      serviceType: 'streaming',
      logoUrl: 'assets/images/providers/spotify.png',
      isActive: true,
      feePercentage: 0,
      createdAt: new Date(2023, 1, 1)
    },
    {
      id: 'prov2',
      name: 'LYDEC',
      serviceType: 'internet',
      logoUrl: 'assets/images/providers/lydec.png',
      isActive: true,
      createdAt: new Date(2023, 1, 1)
    }
  ];

  private mockRecharges: Recharge[] = [
    {
      id: 'rech1',
      accountId: 'acc1',
      providerId: 'prov1',
      providerName: 'Maroc Telecom',
      recipientIdentifier: '0661234567',
      amount: 100,
      currency: 'MAD',
      status: 'completed',
      transactionId: 'tx123',
      createdAt: new Date(2023, 5, 5),
      executedAt: new Date(2023, 5, 5),
      reference: 'MT-100-0661234567'
    },
    {
      id: 'rech2',
      accountId: 'acc1',
      providerId: 'prov5',
      providerName: 'Inwi',
      recipientIdentifier: '0621234567',
      amount: 50,
      currency: 'MAD',
      status: 'completed',
      transactionId: 'tx124',
      createdAt: new Date(2023, 5, 2),
      executedAt: new Date(2023, 5, 2),
      reference: 'INWI-50-0621234567'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les factures d'un client
   */
  getClientBills(clientId: string, status?: string): Observable<Bill[]> {
    let filteredBills = this.mockBills.filter(bill => bill.clientId === clientId);
    
    if (status) {
      filteredBills = filteredBills.filter(bill => bill.status === status);
    }
    
    return of(filteredBills).pipe(delay(500));
  }

  /**
   * Récupère le détail d'une facture
   */
  getBillDetails(billId: string): Observable<Bill | undefined> {
    const bill = this.mockBills.find(b => b.id === billId);
    return of(bill).pipe(delay(300));
  }

  /**
   * Payer une facture
   */
  payBill(billId: string, paymentData: { accountId: string, amount: number }): Observable<BillPayment> {
    const bill = this.mockBills.find(b => b.id === billId);
    if (!bill) {
      throw new Error('Facture non trouvée');
    }
    
    const payment: BillPayment = {
      id: 'pay' + new Date().getTime(),
      billId: billId,
      accountId: paymentData.accountId,
      amount: paymentData.amount,
      currency: bill.currency,
      paymentDate: new Date(),
      status: 'completed',
      reference: `PAY-${bill.providerName}-${new Date().getTime()}`,
      transactionId: 'tx' + new Date().getTime(),
      createdAt: new Date()
    };
    
    // Mettre à jour la facture
    const billIndex = this.mockBills.findIndex(b => b.id === billId);
    if (billIndex !== -1) {
      const updatedBill = { ...this.mockBills[billIndex] };
      updatedBill.paidAmount = updatedBill.paidAmount + paymentData.amount;
      updatedBill.paidDate = new Date();
      
      if (updatedBill.paidAmount >= updatedBill.amount) {
        updatedBill.isPaid = true;
        updatedBill.status = 'paid';
      } else if (updatedBill.paidAmount > 0) {
        updatedBill.status = 'partial';
      }
      
      this.mockBills[billIndex] = updatedBill;
    }
    
    return of(payment).pipe(delay(1000));
  }

  /**
   * Ajouter une nouvelle facture
   */
  addBill(billFormData: BillFormData, clientId: string): Observable<Bill> {
    const provider = this.mockRechargeProviders.find(p => p.id === billFormData.providerId);
    
    const newBill: Bill = {
      id: 'bill' + new Date().getTime(),
      clientId: clientId,
      providerId: billFormData.providerId,
      providerName: provider?.name || 'Fournisseur inconnu',
      referenceNumber: billFormData.referenceNumber,
      amount: billFormData.amount,
      currency: billFormData.currency,
      dueDate: billFormData.dueDate,
      isPaid: false,
      isRecurring: billFormData.isRecurring,
      recurringFrequency: billFormData.recurringFrequency,
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(),
      notificationEnabled: billFormData.notificationEnabled,
      billCategory: billFormData.billCategory,
      logo: provider?.logoUrl
    };
    
    this.mockBills.push(newBill);
    
    return of(newBill).pipe(delay(800));
  }

  /**
   * Récupère tous les fournisseurs de recharge
   */
  getRechargeProviders(type?: string): Observable<RechargeProvider[]> {
    let providers = this.mockRechargeProviders;
    
    if (type) {
      providers = providers.filter(p => p.serviceType === type);
    }
    
    return of(providers).pipe(delay(500));
  }

  /**
   * Récupère l'historique des recharges d'un client
   */
  getClientRecharges(accountId: string): Observable<Recharge[]> {
    return of(this.mockRecharges.filter(r => r.accountId === accountId))
      .pipe(delay(500));
  }

  /**
   * Effectue une nouvelle recharge
   */
  performRecharge(rechargeData: RechargeFormData): Observable<Recharge> {
    const provider = this.mockRechargeProviders.find(p => p.id === rechargeData.providerId);
    
    const reference = `${provider?.name?.toUpperCase().replace(' ', '-') || 'RECH'}-${rechargeData.amount}-${rechargeData.recipientIdentifier}`;
    
    const newRecharge: Recharge = {
      id: 'rech' + new Date().getTime(),
      accountId: rechargeData.accountId,
      providerId: rechargeData.providerId,
      providerName: provider?.name,
      recipientIdentifier: rechargeData.recipientIdentifier,
      amount: rechargeData.amount,
      currency: 'MAD', // Par défaut pour l'exemple
      status: 'completed',
      transactionId: 'tx' + new Date().getTime(),
      createdAt: new Date(),
      executedAt: new Date(),
      reference: reference
    };
    
    this.mockRecharges.push(newRecharge);
    
    return of(newRecharge).pipe(delay(1500));
  }
}