import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Account, AccountDetails, AccountFormData, AccountTransaction } from '../../shared/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = `/accounts`;
  
  // Données mock pour le développement
  private mockAccounts: Account[] = [
    {
      id: 'acc1',
      clientId: 'client1',
      accountNumber: '010023456789',
      type: 'current',
      balance: 24500.75,
      currency: 'MAD',
      status: 'active',
      openedDate: new Date('2021-03-15'),
      lastTransactionDate: new Date('2023-05-10'),
      iban: 'MA64 0101 1234 5678 9012 3456 789',
      dailyLimit: 10000,
      monthlyLimit: 50000,
      isPrimary: true,
      createdAt: new Date('2021-03-15')
    },
    {
      id: 'acc2',
      clientId: 'client1',
      accountNumber: '010023456790',
      type: 'savings',
      balance: 45750.50,
      currency: 'MAD',
      status: 'active',
      openedDate: new Date('2021-06-20'),
      lastTransactionDate: new Date('2023-04-25'),
      iban: 'MA64 0101 1234 5678 9012 3456 790',
      interestRate: 2.5,
      createdAt: new Date('2021-06-20')
    },
    {
      id: 'acc3',
      clientId: 'client1',
      accountNumber: '010023456791',
      type: 'investment',
      balance: 120000,
      currency: 'MAD',
      status: 'active',
      openedDate: new Date('2022-01-10'),
      lastTransactionDate: new Date('2023-05-01'),
      interestRate: 4.2,
      createdAt: new Date('2022-01-10')
    },
    {
      id: 'acc4',
      clientId: 'client2',
      accountNumber: '010034567890',
      type: 'current',
      balance: 18700.25,
      currency: 'MAD',
      status: 'active',
      openedDate: new Date('2021-05-12'),
      lastTransactionDate: new Date('2023-05-09'),
      iban: 'MA64 0101 1234 5678 9012 3456 891',
      dailyLimit: 8000,
      monthlyLimit: 40000,
      isPrimary: true,
      createdAt: new Date('2021-05-12')
    }
  ];

  private mockTransactions: AccountTransaction[] = [
    {
      id: 'trx1',
      accountId: 'acc1',
      amount: -500,
      currency: 'MAD',
      type: 'withdrawal',
      status: 'completed',
      reference: 'ATM-3456',
      date: new Date('2023-05-10'),
      balanceAfterTransaction: 24500.75,
      description: 'Retrait DAB Casablanca Centre',
      category: 'withdrawal'
    },
    {
      id: 'trx2',
      accountId: 'acc1',
      amount: 15000,
      currency: 'MAD',
      type: 'deposit',
      status: 'completed',
      reference: 'DEP-7890',
      date: new Date('2023-05-05'),
      balanceAfterTransaction: 25000.75,
      description: 'Dépôt salaire',
      category: 'income'
    },
    {
      id: 'trx3',
      accountId: 'acc1',
      amount: -1200,
      currency: 'MAD',
      type: 'payment',
      status: 'completed',
      reference: 'BILL-123',
      date: new Date('2023-05-03'),
      balanceAfterTransaction: 10000.75,
      description: 'Paiement facture LYDEC',
      category: 'utilities'
    },
    {
      id: 'trx4',
      accountId: 'acc2',
      amount: 5000,
      currency: 'MAD',
      type: 'transfer_in',
      status: 'completed',
      reference: 'TRF-456',
      date: new Date('2023-04-25'),
      balanceAfterTransaction: 45750.50,
      description: 'Virement depuis compte courant',
      category: 'transfer'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les comptes d'un client
   */
  getClientAccounts(clientId: string): Observable<Account[]> {
    // Dans un environnement de production, remplacer par un appel HTTP
    // return this.http.get<Account[]>(`${this.apiUrl}/client/${clientId}`);

    return of(this.mockAccounts.filter(account => account.clientId === clientId))
      .pipe(delay(800)); // Simulation d'un délai réseau
  }

  /**
   * Récupère les détails d'un compte spécifique avec ses transactions
   */
  getAccountDetails(accountId: string): Observable<AccountDetails> {
    // Dans un environnement de production:
    // return this.http.get<AccountDetails>(`${this.apiUrl}/${accountId}`);

    const account = this.mockAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    const accountTransactions = this.mockTransactions.filter(trx => trx.accountId === accountId);
    
    const accountDetails: AccountDetails = {
      ...account,
      transactions: accountTransactions,
      // Calcul du solde disponible (peut varier selon les règles métier)
      availableBalance: account.balance - (account.type === 'current' ? 200 : 0), // Exemple: garder 200 MAD min sur compte courant
      pendingTransfers: 0, // À calculer à partir des transferts en attente
    };

    return of(accountDetails).pipe(delay(1000));
  }

  /**
   * Récupère les transactions d'un compte
   */
  getAccountTransactions(accountId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    type?: string;
  }): Observable<AccountTransaction[]> {
    // Dans un environnement de production:
    // return this.http.get<AccountTransaction[]>(`${this.apiUrl}/${accountId}/transactions`, { params: {...filters} });
    
    let transactions = this.mockTransactions.filter(trx => trx.accountId === accountId);
    
    // Appliquer les filtres si nécessaire
    if (filters) {
      if (filters.startDate) {
        transactions = transactions.filter(trx => new Date(trx.date) >= new Date(filters.startDate!));
      }
      
      if (filters.endDate) {
        transactions = transactions.filter(trx => new Date(trx.date) <= new Date(filters.endDate!));
      }
      
      if (filters.category) {
        transactions = transactions.filter(trx => trx.category === filters.category);
      }
      
      if (filters.type) {
        transactions = transactions.filter(trx => trx.type === filters.type);
      }
    }
    
    // Trier par date décroissante (du plus récent au plus ancien)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return of(transactions).pipe(delay(800));
  }

  /**
   * Crée un nouveau compte pour un client
   */
  createAccount(clientId: string, accountData: AccountFormData): Observable<Account> {
    // Dans un environnement de production:
    // return this.http.post<Account>(`${this.apiUrl}`, { clientId, ...accountData });
    
    const newId = `acc${this.mockAccounts.length + 1}`;
    const lastDigits = Math.floor(10000 + Math.random() * 90000);
    
    const newAccount: Account = {
      id: newId,
      clientId: clientId,
      accountNumber: `0100${lastDigits}`,
      type: accountData.type,
      balance: accountData.initialDeposit || 0,
      currency: accountData.currency,
      status: 'active',
      openedDate: new Date(),
      iban: `MA64 0101 1234 5678 9012 3456 ${lastDigits}`,
      dailyLimit: accountData.type === 'current' ? 10000 : undefined,
      monthlyLimit: accountData.type === 'current' ? 50000 : undefined,
      isPrimary: this.mockAccounts.filter(acc => acc.clientId === clientId).length === 0,
      interestRate: accountData.type === 'savings' ? 2.25 : (accountData.type === 'investment' ? 4.5 : undefined),
      createdAt: new Date()
    };
    
    this.mockAccounts.push(newAccount);
    
    return of(newAccount).pipe(delay(1200));
  }

  /**
   * Effectue un virement interne entre deux comptes
   */
  transferBetweenAccounts(sourceAccountId: string, destinationAccountId: string, amount: number, description?: string): Observable<{sourceAccount: Account; destinationAccount: Account}> {
    // Dans un environnement de production:
    // return this.http.post<{sourceAccount: Account; destinationAccount: Account}>(
    //   `${this.apiUrl}/transfer`, 
    //   { sourceAccountId, destinationAccountId, amount, description }
    // );
    
    const sourceAccount = this.mockAccounts.find(acc => acc.id === sourceAccountId);
    const destinationAccount = this.mockAccounts.find(acc => acc.id === destinationAccountId);
    
    if (!sourceAccount || !destinationAccount) {
      throw new Error('Compte(s) non trouvé(s)');
    }
    
    if (sourceAccount.balance < amount) {
      throw new Error('Solde insuffisant');
    }
    
    // Mettre à jour les soldes
    sourceAccount.balance -= amount;
    sourceAccount.lastTransactionDate = new Date();
    
    destinationAccount.balance += amount;
    destinationAccount.lastTransactionDate = new Date();
    
    // Créer les transactions
    const txnId = `trx${this.mockTransactions.length + 1}`;
    const reference = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
    
    this.mockTransactions.push({
      id: txnId,
      accountId: sourceAccountId,
      amount: -amount,
      currency: sourceAccount.currency,
      type: 'transfer_out',
      status: 'completed',
      reference: reference,
      date: new Date(),
      balanceAfterTransaction: sourceAccount.balance,
      description: description || `Virement vers ${destinationAccount.accountNumber}`,
      category: 'transfer'
    });
    
    this.mockTransactions.push({
      id: `${txnId}-b`,
      accountId: destinationAccountId,
      amount: amount,
      currency: destinationAccount.currency,
      type: 'transfer_in',
      status: 'completed',
      reference: reference,
      date: new Date(),
      balanceAfterTransaction: destinationAccount.balance,
      description: description || `Virement depuis ${sourceAccount.accountNumber}`,
      category: 'transfer'
    });
    
    return of({sourceAccount, destinationAccount}).pipe(delay(1500));
  }

  /**
   * Télécharge le relevé bancaire d'un compte pour une période donnée
   */
  downloadAccountStatement(accountId: string, startDate: Date, endDate: Date, format: 'pdf' | 'csv' = 'pdf'): Observable<string> {
    // Dans un environnement de production:
    // return this.http.get(`${this.apiUrl}/${accountId}/statement`, {
    //   params: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), format },
    //   responseType: 'blob'
    // }).pipe(map(blob => URL.createObjectURL(blob)));
    
    // Simulation de génération d'un relevé
    const account = this.mockAccounts.find(acc => acc.id === accountId);
    if (!account) {
      throw new Error('Compte non trouvé');
    }
    
    // Simuler une URL de téléchargement
    return of(`/assets/mock-statements/${accountId}-statement-${format}.${format}`).pipe(delay(2000));
  }

  /**
   * Met à jour les paramètres d'un compte
   */
  updateAccountSettings(accountId: string, settings: {
    dailyLimit?: number;
    monthlyLimit?: number;
    isPrimary?: boolean;
  }): Observable<Account> {
    // Dans un environnement de production:
    // return this.http.patch<Account>(`${this.apiUrl}/${accountId}/settings`, settings);
    
    const accountIndex = this.mockAccounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      throw new Error('Compte non trouvé');
    }
    
    // Mettre à jour les paramètres
    this.mockAccounts[accountIndex] = {
      ...this.mockAccounts[accountIndex],
      ...settings,
      updatedAt: new Date()
    };
    
    return of(this.mockAccounts[accountIndex]).pipe(delay(1000));
  }

  /**
   * Bloque ou débloque un compte
   */
  toggleAccountStatus(accountId: string, status: 'active' | 'blocked'): Observable<Account> {
    // Dans un environnement de production:
    // return this.http.patch<Account>(`${this.apiUrl}/${accountId}/status`, { status });
    
    const accountIndex = this.mockAccounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      throw new Error('Compte non trouvé');
    }
    
    this.mockAccounts[accountIndex] = {
      ...this.mockAccounts[accountIndex],
      status: status,
      updatedAt: new Date()
    };
    
    return of(this.mockAccounts[accountIndex]).pipe(delay(1000));
  }
}