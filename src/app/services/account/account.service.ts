import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { Account, AccountDetails, AccountFormData, AccountTransaction } from '../../shared/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = '/api/accounts';
  
  // Données mock pour le développement
  private mockAccounts: Account[] = [
    {
      id: 'acc1',
      clientId: 'client1',
      accountNumber: '010023456789',
      type: 'current',
      balance: 24500.75,
      availableBalance: 24000.75,
      currency: 'MAD',
      status: 'active',
      openedDate: '2021-03-15T00:00:00Z',
      lastTransactionDate: '2023-05-10T00:00:00Z',
      iban: 'MA64 0101 1234 5678 9012 3456 789',
      rib: 'RIB123456',
      dailyLimit: 10000,
      monthlyLimit: 50000,
      isPrimary: true,
      createdAt: '2021-03-15T00:00:00Z',
      updatedAt: '2023-05-10T00:00:00Z'
    },
    {
      id: 'acc2',
      clientId: 'client1',
      accountNumber: '010023456790',
      type: 'savings',
      balance: 45750.50,
      availableBalance: 45750.50,
      currency: 'MAD',
      status: 'active',
      openedDate: '2021-06-20T00:00:00Z',
      lastTransactionDate: '2023-04-25T00:00:00Z',
      iban: 'MA64 0101 1234 5678 9012 3456 790',
      rib: 'RIB234567',
      interestRate: 2.5,
      createdAt: '2021-06-20T00:00:00Z',
      updatedAt: '2023-04-25T00:00:00Z'
    },
    {
      id: 'acc3',
      clientId: 'client1',
      accountNumber: '010023456791',
      type: 'investment',
      balance: 120000,
      availableBalance: 120000,
      currency: 'MAD',
      status: 'active',
      openedDate: '2022-01-10T00:00:00Z',
      lastTransactionDate: '2023-05-01T00:00:00Z',
      iban: 'MA64 0101 1234 5678 9012 3456 791',
      rib: 'RIB345678',
      interestRate: 4.2,
      createdAt: '2022-01-10T00:00:00Z',
      updatedAt: '2023-05-01T00:00:00Z'
    },
    {
      id: 'acc4',
      clientId: 'client2',
      accountNumber: '010034567890',
      type: 'current',
      balance: 18700.25,
      availableBalance: 18500.25,
      currency: 'MAD',
      status: 'active',
      openedDate: '2021-05-12T00:00:00Z',
      lastTransactionDate: '2023-05-09T00:00:00Z',
      iban: 'MA64 0101 1234 5678 9012 3456 891',
      rib: 'RIB456789',
      dailyLimit: 8000,
      monthlyLimit: 40000,
      isPrimary: true,
      createdAt: '2021-05-12T00:00:00Z',
      updatedAt: '2023-05-09T00:00:00Z'
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
      date: '2023-05-10T14:30:00Z',
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
      date: '2023-05-05T10:15:00Z',
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
      date: '2023-05-03T16:45:00Z',
      balanceAfterTransaction: 10000.75,
      description: 'Paiement facture LYDEC',
      category: 'utilities'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Formate les dates en chaînes ISO
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
   * Récupérer tous les comptes
   */
  getAllAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}`).pipe(
      catchError(() => of(this.mockAccounts))
    );
  }

  /**
   * Récupérer un compte par ID
   */
  getAccountById(accountId: string): Observable<Account | undefined> {
    return this.http.get<Account>(`${this.apiUrl}/${accountId}`).pipe(
      catchError(() => {
        const account = this.mockAccounts.find(acc => acc.id === accountId);
        return of(account);
      })
    );
  }

  /**
   * Récupérer un compte par numéro de compte
   */
  getAccountByAccountNumber(accountNumber: string): Observable<Account | undefined> {
    return this.http.get<Account>(`${this.apiUrl}/number/${accountNumber}`).pipe(
      catchError(() => {
        const account = this.mockAccounts.find(acc => acc.accountNumber === accountNumber);
        return of(account);
      })
    );
  }

  /**
   * Récupérer tous les comptes d'un client
   * Méthode ajoutée pour compatibilité avec le ClientService
   */
  getClientAccounts(clientId: string): Observable<Account[]> {
    return this.getAccountsByClient(clientId);
  }

  /**
   * Récupérer tous les comptes d'un client
   */
  getAccountsByClient(clientId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/client/${clientId}`).pipe(
      catchError(() => of(this.mockAccounts.filter(account => account.clientId === clientId)))
    );
  }

  /**
   * Récupérer les comptes actifs d'un client
   */
  getActiveAccountsByClient(clientId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/client/${clientId}/active`).pipe(
      catchError(() => of(this.mockAccounts.filter(
        account => account.clientId === clientId && account.status === 'active'
      )))
    );
  }

  /**
   * Créer un nouveau compte pour un client 
   * Méthode simplifiée utilisée dans les composants
   */
  createAccount(
    clientId: string, 
    accountData: { 
      type: 'current' | 'savings' | 'investment' | 'fixed' | 'other'; 
      currency: string; 
      initialDeposit: number 
    }
  ): Observable<Account> {
    // Adaptateur pour utiliser la méthode existante
    return this.http.post<Account>(
      `${this.apiUrl}`, 
      {
        clientId,
        type: accountData.type,
        currency: accountData.currency,
        balance: accountData.initialDeposit,
        status: 'active'
      }
    ).pipe(
      catchError(() => {
        const now = new Date().toISOString();
        const newId = `acc${this.mockAccounts.length + 1}`;
        const lastDigits = Math.floor(10000 + Math.random() * 90000);
        
        const newAccount: Account = {
          id: newId,
          clientId: clientId,
          accountNumber: `0100${lastDigits}`,
          type: accountData.type,
          balance: accountData.initialDeposit,
          availableBalance: accountData.type === 'current' ? 
            accountData.initialDeposit - 200 : accountData.initialDeposit,
          currency: accountData.currency,
          status: 'active',
          openedDate: now,
          lastTransactionDate: now,
          iban: `MA64 0101 1234 5678 9012 3456 ${lastDigits}`,
          rib: `RIB${lastDigits}`,
          dailyLimit: accountData.type === 'current' ? 10000 : undefined,
          monthlyLimit: accountData.type === 'current' ? 50000 : undefined,
          isPrimary: this.mockAccounts.filter(acc => acc.clientId === clientId).length === 0,
          interestRate: accountData.type === 'savings' ? 2.25 : 
            (accountData.type === 'investment' ? 4.5 : undefined),
          createdAt: now,
          updatedAt: now
        };
        
        this.mockAccounts.push(newAccount);
        
        // Créer une transaction initiale si le dépôt n'est pas zéro
        if (accountData.initialDeposit > 0) {
          const txnId = `trx${this.mockTransactions.length + 1}`;
          this.mockTransactions.push({
            id: txnId,
            accountId: newId,
            amount: accountData.initialDeposit,
            currency: accountData.currency,
            type: 'deposit',
            status: 'completed',
            reference: `DEP-INIT-${lastDigits}`,
            date: now,
            balanceAfterTransaction: accountData.initialDeposit,
            description: `Dépôt initial`,
            category: 'deposit'
          });
        }
        
        return of(newAccount);
      })
    ).pipe(delay(1000)); // Simuler un délai réseau
  }

  /**
   * Créer un nouveau compte pour un client avec une devise spécifique
   */
  createAccountWithCurrency(clientId: string, currencyId: string, account: Partial<Account> = {}): Observable<Account> {
    const formattedAccount = this.formatDates(account);
    
    return this.http.post<Account>(
      `${this.apiUrl}/${clientId}/${currencyId}`, 
      formattedAccount
    ).pipe(
      catchError(() => {
        const now = new Date().toISOString();
        const newId = `acc${this.mockAccounts.length + 1}`;
        const lastDigits = Math.floor(10000 + Math.random() * 90000);
        
        const newAccount: Account = {
          id: newId,
          clientId: clientId,
          accountNumber: `0100${lastDigits}`,
          type: account.type || 'current',
          balance: account.balance || 0,
          availableBalance: account.availableBalance || account.balance || 0,
          currency: currencyId,
          status: account.status || 'active',
          openedDate: now,
          lastTransactionDate: now,
          iban: `MA64 0101 1234 5678 9012 3456 ${lastDigits}`,
          rib: `RIB${lastDigits}`,
          dailyLimit: account.type === 'current' ? 10000 : undefined,
          monthlyLimit: account.type === 'current' ? 50000 : undefined,
          isPrimary: this.mockAccounts.filter(acc => acc.clientId === clientId).length === 0,
          interestRate: account.type === 'savings' ? 2.25 : (account.type === 'investment' ? 4.5 : undefined),
          createdAt: now,
          updatedAt: now
        };
        
        this.mockAccounts.push(newAccount);
        return of(newAccount);
      })
    );
  }

  /**
   * Mettre à jour un compte
   */
  updateAccount(accountId: string, account: Partial<Account>): Observable<Account> {
    const formattedAccount = this.formatDates(account);
    
    return this.http.put<Account>(`${this.apiUrl}/${accountId}`, formattedAccount).pipe(
      catchError(() => {
        const accountIndex = this.mockAccounts.findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) {
          return throwError(() => new Error('Account not found'));
        }
        
        const now = new Date().toISOString();
        this.mockAccounts[accountIndex] = { 
          ...this.mockAccounts[accountIndex], 
          ...formattedAccount,
          updatedAt: now
        };
        
        return of(this.mockAccounts[accountIndex]);
      })
    );
  }

  /**
   * Mettre à jour le solde d'un compte
   */
  updateBalance(accountId: string, newBalance: number): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/balance/${accountId}`, newBalance).pipe(
      catchError(() => {
        const accountIndex = this.mockAccounts.findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) {
          return throwError(() => new Error('Account not found'));
        }
        
        const now = new Date().toISOString();
        this.mockAccounts[accountIndex] = { 
          ...this.mockAccounts[accountIndex],
          balance: newBalance,
          availableBalance: newBalance - 500, // Exemple arbitraire
          updatedAt: now,
          lastTransactionDate: now
        };
        
        return of(this.mockAccounts[accountIndex]);
      })
    );
  }

  /**
   * Récupérer les détails d'un compte avec ses transactions
   * (Cette méthode n'est pas directement exposée par le backend mais utile côté client)
   */
  getAccountDetails(accountId: string): Observable<AccountDetails> {
    return this.getAccountById(accountId).pipe(
      map(account => {
        if (!account) {
          throw new Error('Account not found');
        }
        
        const transactions = this.mockTransactions.filter(trx => trx.accountId === accountId);
        
        return {
          ...account,
          transactions,
          pendingTransfers: 0
        };
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Récupérer les transactions d'un compte
   * (Cette méthode pourrait être ajoutée côté backend)
   */
  getAccountTransactions(accountId: string, filters?: {
    startDate?: Date | string;
    endDate?: Date | string;
    category?: string;
    type?: string;
  }): Observable<AccountTransaction[]> {
    let transactions = this.mockTransactions.filter(trx => trx.accountId === accountId);
    
    // Appliquer les filtres si nécessaire
    if (filters) {
      if (filters.startDate) {
        const startDate = this.formatDate(filters.startDate);
        transactions = transactions.filter(trx => trx.date >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = this.formatDate(filters.endDate);
        transactions = transactions.filter(trx => trx.date <= endDate);
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
   * Effectuer un virement interne entre deux comptes
   * (Cette méthode pourrait être ajoutée côté backend)
   */
  transferBetweenAccounts(
    sourceAccountId: string, 
    destinationAccountId: string, 
    amount: number, 
    description?: string
  ): Observable<{sourceAccount: Account; destinationAccount: Account}> {
    // Cette fonctionnalité n'est pas exposée par le backend mais pourrait être utile
    // Pour l'instant, nous simulons avec les mock data
    
    const sourceAccountIndex = this.mockAccounts.findIndex(acc => acc.id === sourceAccountId);
    const destinationAccountIndex = this.mockAccounts.findIndex(acc => acc.id === destinationAccountId);
    
    if (sourceAccountIndex === -1 || destinationAccountIndex === -1) {
      return throwError(() => new Error('Account(s) not found'));
    }
    
    if (this.mockAccounts[sourceAccountIndex].balance < amount) {
      return throwError(() => new Error('Insufficient funds'));
    }
    
    // Mettre à jour les soldes
    const now = new Date().toISOString();
    
    // Compte source
    this.mockAccounts[sourceAccountIndex] = {
      ...this.mockAccounts[sourceAccountIndex],
      balance: this.mockAccounts[sourceAccountIndex].balance - amount,
      availableBalance: this.mockAccounts[sourceAccountIndex].availableBalance 
        ? this.mockAccounts[sourceAccountIndex].availableBalance - amount 
        : this.mockAccounts[sourceAccountIndex].balance - amount,
      lastTransactionDate: now,
      updatedAt: now
    };
    
    // Compte destination
    this.mockAccounts[destinationAccountIndex] = {
      ...this.mockAccounts[destinationAccountIndex],
      balance: this.mockAccounts[destinationAccountIndex].balance + amount,
      availableBalance: this.mockAccounts[destinationAccountIndex].availableBalance 
        ? this.mockAccounts[destinationAccountIndex].availableBalance + amount 
        : this.mockAccounts[destinationAccountIndex].balance + amount,
      lastTransactionDate: now,
      updatedAt: now
    };
    
    // Créer les transactions
    const txnId = `trx${this.mockTransactions.length + 1}`;
    const reference = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
    
    this.mockTransactions.push({
      id: txnId,
      accountId: sourceAccountId,
      amount: -amount,
      currency: this.mockAccounts[sourceAccountIndex].currency,
      type: 'transfer_out',
      status: 'completed',
      reference: reference,
      date: now,
      balanceAfterTransaction: this.mockAccounts[sourceAccountIndex].balance,
      description: description || `Virement vers ${this.mockAccounts[destinationAccountIndex].accountNumber}`,
      category: 'transfer'
    });
    
    this.mockTransactions.push({
      id: `${txnId}-b`,
      accountId: destinationAccountId,
      amount: amount,
      currency: this.mockAccounts[destinationAccountIndex].currency,
      type: 'transfer_in',
      status: 'completed',
      reference: reference,
      date: now,
      balanceAfterTransaction: this.mockAccounts[destinationAccountIndex].balance,
      description: description || `Virement depuis ${this.mockAccounts[sourceAccountIndex].accountNumber}`,
      category: 'transfer'
    });
    
    return of({
      sourceAccount: this.mockAccounts[sourceAccountIndex],
      destinationAccount: this.mockAccounts[destinationAccountIndex]
    }).pipe(delay(1500));
  }

  /**
   * Télécharger un relevé de compte
   * @param accountId ID du compte
   * @param startDate Date de début de la période
   * @param endDate Date de fin de la période
   * @param format Format du relevé (pdf, csv, etc.)
   * @returns URL du document généré
   */
  downloadAccountStatement(
    accountId: string, 
    startDate: Date, 
    endDate: Date, 
    format: 'pdf' | 'csv' = 'pdf'
  ): Observable<string> {
    // Simuler une URL de téléchargement pour un relevé de compte
    const params = new HttpParams()
      .set('startDate', this.formatDate(startDate))
      .set('endDate', this.formatDate(endDate))
      .set('format', format);
      
    return this.http.get<{url: string}>(`${this.apiUrl}/${accountId}/statement`, { params }).pipe(
      map(response => response.url),
      catchError(() => {
        // Simuler une URL
        const account = this.mockAccounts.find(acc => acc.id === accountId);
        if (!account) {
          return throwError(() => new Error('Account not found'));
        }
        
        // L'URL serait normalement générée par le backend
        return of(`/documents/statements/${accountId}_${format}_${new Date().getTime()}.${format}`);
      }),
      delay(1500) // Simuler le temps de génération
    );
  }
}