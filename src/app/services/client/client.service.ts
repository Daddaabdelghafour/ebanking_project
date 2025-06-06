import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap, delay, switchMap } from 'rxjs/operators';
import { Client, ClientFormData } from '../../shared/models/client.model';
import { Account } from '../../shared/models/account.model';
import { User } from '../../shared/models/user.model';

// Stripe interfaces for client view
interface StripeAccount {
  id: string;
  email: string;
  country: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  type: string;
}

interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
  }>;
}

interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created: number;
}

interface ClientFinancialData {
  client: Client;
  accounts: Account[];
  stripeAccount?: StripeAccount;
  stripeBalance?: StripeBalance;
  stripeCustomer?: StripeCustomer;
  hasStripeIntegration: boolean;
  summary: {
    totalBankBalance: number;
    totalStripeBalance: number;
    totalCombinedBalance: number;
    availableBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    activeAccountsCount: number;
    stripeAccountStatus: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  // URL de l'API
  private apiUrl = 'http://localhost:8085/E-BANKING1/api'; // URL de base
  private clientApiUrl = `${this.apiUrl}/clients`; // Point d'accès clients
  private userApiUrl = `${this.apiUrl}/users`; // Point d'accès utilisateurs
  
  // ID de test pour le développement
  private testClientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4'; // ID client de test
  
  // Force l'utilisation des données mockées pendant le développement
  private useMockData = false; // Mettre à true pour éviter les appels API

  constructor(private http: HttpClient) {}

  // ===== NEW STRIPE INTEGRATION METHODS =====

  /**
   * Get complete client financial data including Stripe (READ-ONLY for client)
   */
  getClientFinancialData(clientId?: string): Observable<ClientFinancialData> {
    const id = clientId || this.testClientId;
    
    console.log(`Loading financial data for client: ${id}`);
    
    if (this.useMockData) {
      return this.getMockClientFinancialData(id);
    }
    
    // First get client info to extract userId
    return this.getClientById(id).pipe(
      switchMap(client => {
        if (!client) {
          throw new Error(`Client with ID ${id} not found`);
        }
        
        // Use client.id as userId (adjust based on your data structure)
        const userId = client.id;
        
        // Load all data in parallel
        return forkJoin({
          client: of(client),
          accounts: this.getClientAccounts(id),
          stripeAccount: userId ? this.getStripeAccountInfo(userId) : of(null),
          stripeBalance: userId ? this.getStripeBalanceInfo(userId) : of(null),
          stripeCustomer: userId ? this.getStripeCustomerInfo(userId) : of(null)
        });
      }),
      map(data => this.combineClientFinancialData(data)),
      catchError(error => {
        console.error('Error loading client financial data:', error);
        return this.getMockClientFinancialData(id);
      })
    );
  }

  /**
   * Get Stripe account info (READ-ONLY)
   */
  private getStripeAccountInfo(userId: string): Observable<StripeAccount | null> {
    if (this.useMockData) {
      return of(this.generateMockStripeAccount(userId)).pipe(delay(300));
    }
    
    return this.http.get<StripeAccount>(`${this.apiUrl}/stripe/byuserid/${userId}`).pipe(
      tap(account => console.log('Stripe account info loaded:', account?.id)),
      catchError(error => {
        console.log('No Stripe account found for user:', userId);
        return of(null);
      })
    );
  }

  /**
   * Get Stripe balance info (READ-ONLY)
   */
  private getStripeBalanceInfo(userId: string): Observable<StripeBalance | null> {
    if (this.useMockData) {
      return of(this.generateMockStripeBalance()).pipe(delay(300));
    }
    
    return this.http.get<StripeBalance>(`${this.apiUrl}/stripe/balance/${userId}`).pipe(
      tap(balance => console.log('Stripe balance loaded:', balance?.available?.length || 0, 'currencies')),
      catchError(error => {
        console.log('No Stripe balance found for user:', userId);
        return of(null);
      })
    );
  }

  /**
   * Get Stripe customer info (READ-ONLY)
   */
  private getStripeCustomerInfo(userId: string): Observable<StripeCustomer | null> {
    if (this.useMockData) {
      return of(this.generateMockStripeCustomer(userId)).pipe(delay(300));
    }
    
    return this.http.get<StripeCustomer>(`${this.apiUrl}/stripe/customer/${userId}`).pipe(
      tap(customer => console.log('Stripe customer info loaded:', customer?.id)),
      catchError(error => {
        console.log('No Stripe customer found for user:', userId);
        return of(null);
      })
    );
  }

  /**
   * Refresh client financial data
   */
  refreshClientFinancialData(clientId?: string): Observable<ClientFinancialData> {
    const id = clientId || this.testClientId;
    const cacheBuster = `?t=${Date.now()}`;
    
    if (this.useMockData) {
      return this.getMockClientFinancialData(id);
    }
    
    return this.getClientById(id).pipe(
      switchMap(client => {
        if (!client) {
          throw new Error(`Client with ID ${id} not found`);
        }
        
        const userId = client.id;
        
        return forkJoin({
          client: of(client),
          accounts: this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${id}${cacheBuster}`).pipe(
            catchError(() => of(this.generateMockAccounts(id)))
          ),
          stripeAccount: userId ? this.http.get<StripeAccount>(`${this.apiUrl}/stripe/byuserid/${userId}${cacheBuster}`).pipe(
            catchError(() => of(null))
          ) : of(null),
          stripeBalance: userId ? this.http.get<StripeBalance>(`${this.apiUrl}/stripe/balance/${userId}${cacheBuster}`).pipe(
            catchError(() => of(null))
          ) : of(null),
          stripeCustomer: userId ? this.http.get<StripeCustomer>(`${this.apiUrl}/stripe/customer/${userId}${cacheBuster}`).pipe(
            catchError(() => of(null))
          ) : of(null)
        });
      }),
      map(data => this.combineClientFinancialData(data)),
      catchError(error => {
        console.error('Error refreshing client financial data:', error);
        return this.getMockClientFinancialData(id);
      })
    );
  }

  // ===== STRIPE UTILITY METHODS FOR CLIENT VIEW =====

  /**
   * Get Stripe account status for display
   */
  getStripeAccountStatus(stripeAccount: StripeAccount | null): string {
    return this.getStripeAccountStatusText(stripeAccount);
  }

  /**
   * Get Stripe account status text
   */
  private getStripeAccountStatusText(stripeAccount: StripeAccount | null): string {
    if (!stripeAccount) return 'Pas de compte Stripe';
    
    if (stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled && stripeAccount.detailsSubmitted) {
      return 'Compte actif';
    } else if (stripeAccount.detailsSubmitted) {
      return 'En cours de vérification';
    } else {
      return 'Configuration incomplète';
    }
  }

  /**
   * Get Stripe account status badge class
   */
  getStripeAccountStatusClass(stripeAccount: StripeAccount | null): string {
    if (!stripeAccount) return 'bg-gray-100 text-gray-800';
    
    if (stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled && stripeAccount.detailsSubmitted) {
      return 'bg-green-100 text-green-800';
    } else if (stripeAccount.detailsSubmitted) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  }

  /**
   * Check if Stripe account is fully active
   */
  isStripeAccountActive(stripeAccount: StripeAccount | null): boolean {
    if (!stripeAccount) return false;
    return stripeAccount.chargesEnabled && 
           stripeAccount.payoutsEnabled && 
           stripeAccount.detailsSubmitted;
  }

  /**
   * Format Stripe amount (convert from cents)
   */
  formatStripeAmount(amount: number, currency: string): string {
    const convertedAmount = amount / 100;
    return this.formatCurrency(convertedAmount, currency.toUpperCase());
  }

  /**
   * Get total Stripe balance formatted
   */
  getFormattedStripeBalance(stripeBalance: StripeBalance | null): string {
    if (!stripeBalance?.available?.length) return '0,00 MAD';
    
    const totalAmount = stripeBalance.available.reduce((sum, bal) => {
      return sum + (bal.amount / 100);
    }, 0);
    
    return this.formatCurrency(totalAmount, 'MAD');
  }

  /**
   * Get Stripe balance by currency
   */
  getStripeBalanceByCurrency(stripeBalance: StripeBalance | null, currency: string): number {
    if (!stripeBalance?.available) return 0;
    
    const balance = stripeBalance.available.find(bal => 
      bal.currency.toUpperCase() === currency.toUpperCase()
    );
    
    return balance ? balance.amount / 100 : 0;
  }

  /**
   * Get Stripe pending balance by currency
   */
  getStripePendingBalanceByCurrency(stripeBalance: StripeBalance | null, currency: string): number {
    if (!stripeBalance?.pending) return 0;
    
    const balance = stripeBalance.pending.find(bal => 
      bal.currency.toUpperCase() === currency.toUpperCase()
    );
    
    return balance ? balance.amount / 100 : 0;
  }

  /**
   * Get client full name safely
   */
  getClientFullName(client: Client | null): string {
    if (!client) return 'Client';
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';
  }

  /**
   * Format currency with proper locale
   */
  formatCurrency(amount: number, currency: string = 'MAD'): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get account type display name in French
   */
  getAccountTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      'current': 'Compte Courant',
      'savings': 'Compte Épargne',
      'investment': 'Compte Investissement',
      'fixed': 'Compte à Terme',
      'other': 'Autre'
    };
    return typeMap[type] || type;
  }

  /**
   * Check if client has any active accounts
   */
  hasActiveAccounts(accounts: Account[]): boolean {
    return accounts?.some(account => account.status === 'active') || false;
  }

  /**
   * Get primary account
   */
  getPrimaryAccount(accounts: Account[]): Account | null {
    if (!accounts?.length) return null;
    return accounts.find(account => account.isPrimary && account.status === 'active') || 
           accounts.find(account => account.status === 'active') || 
           null;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Combine client financial data
   */
  private combineClientFinancialData(data: any): ClientFinancialData {
    const { client, accounts, stripeAccount, stripeBalance, stripeCustomer } = data;
    
    const summary = this.calculateClientFinancialSummary(accounts, stripeBalance, stripeAccount);
    
    return {
      client,
      accounts: accounts || [],
      stripeAccount,
      stripeBalance,
      stripeCustomer,
      hasStripeIntegration: !!stripeAccount,
      summary
    };
  }

  /**
   * Calculate client financial summary
   */
  private calculateClientFinancialSummary(accounts: Account[], stripeBalance: StripeBalance | null, stripeAccount: StripeAccount | null) {
    // Calculate total bank balance
    const totalBankBalance = accounts?.reduce((sum, account) => {
      return sum + (account.status === 'active' ? account.balance : 0);
    }, 0) || 0;

    // Calculate available bank balance
    const availableBalance = accounts?.reduce((sum, account) => {
      return sum + (account.status === 'active' ? account.availableBalance : 0);
    }, 0) || 0;

    // Calculate Stripe balance (convert from cents to main currency)
    const totalStripeBalance = stripeBalance?.available?.reduce((sum, bal) => {
      return sum + (bal.amount / 100); // Convert from cents
    }, 0) || 0;

    // Count active accounts
    const activeAccountsCount = accounts?.filter(acc => acc.status === 'active').length || 0;

    // Estimate income/expenses (simplified calculation)
    const monthlyIncome = totalBankBalance * 0.15 || 5000;
    const monthlyExpenses = monthlyIncome * 0.7;

    // Get Stripe account status
    const stripeAccountStatus = this.getStripeAccountStatusText(stripeAccount);

    return {
      totalBankBalance,
      totalStripeBalance,
      totalCombinedBalance: totalBankBalance + totalStripeBalance,
      availableBalance,
      monthlyIncome,
      monthlyExpenses,
      activeAccountsCount,
      stripeAccountStatus
    };
  }

  /**
   * Get mock client financial data
   */
  private getMockClientFinancialData(clientId: string): Observable<ClientFinancialData> {
    const client = this.generateBasicMockClient(clientId);
    const accounts = this.generateMockAccounts(clientId);
    const stripeAccount = this.generateMockStripeAccount(clientId);
    const stripeBalance = this.generateMockStripeBalance();
    const stripeCustomer = this.generateMockStripeCustomer(clientId);
    const summary = this.calculateClientFinancialSummary(accounts, stripeBalance, stripeAccount);
    
    return of({
      client,
      accounts,
      stripeAccount,
      stripeBalance,
      stripeCustomer,
      hasStripeIntegration: true,
      summary
    }).pipe(delay(300));
  }

  /**
   * Generate mock Stripe account
   */
  private generateMockStripeAccount(userId: string): StripeAccount {
    return {
      id: 'acct_1234567890',
      email: 'ahmed.bennani@email.com',
      country: 'MA',
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      type: 'express'
    };
  }

  /**
   * Generate mock Stripe balance
   */
  private generateMockStripeBalance(): StripeBalance {
    return {
      available: [
        { amount: 1250000, currency: 'mad' }, // 12,500 MAD in cents
        { amount: 85000, currency: 'eur' }    // 850 EUR in cents
      ],
      pending: [
        { amount: 45000, currency: 'mad' }    // 450 MAD in cents
      ]
    };
  }

  /**
   * Generate mock Stripe customer
   */
  private generateMockStripeCustomer(userId: string): StripeCustomer {
    return {
      id: 'cus_1234567890',
      email: 'ahmed.bennani@email.com',
      name: 'Ahmed Bennani',
      phone: '+212600000000',
      created: Math.floor(Date.now() / 1000)
    };
  }

  // ===== ALL EXISTING METHODS (UNCHANGED) =====

  /**
   * Formate les dates en chaînes ISO si nécessaire
   */
  private formatDates<T>(obj: T): T {
    if (!obj) return obj;
    
    const formatted = { ...obj } as any;
    
    // Parcourir toutes les propriétés pour trouver les dates et les formatter
    for (const key in formatted) {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatted[key].toISOString();
      } else if (typeof formatted[key] === 'object' && formatted[key] !== null) {
        formatted[key] = this.formatDates(formatted[key]);
      }
    }
    
    return formatted as T;
  }

  /**
   * Récupérer tous les clients
   */
  getClients(): Observable<Client[]> {
    // Utiliser directement l'endpoint /clients
    if (this.useMockData) {
      return of(this.generateBasicMockClients()).pipe(delay(300));
    }
    
    return this.http.get<ClientDTO[]>(`${this.clientApiUrl}`).pipe(
      map(clients => clients.map(client => this.clientDtoToClient(client))),
      catchError(error => {
        console.error('Erreur lors de la récupération des clients:', error);
        return of(this.generateBasicMockClients());
      })
    );
  }

  /**
   * Récupérer un client par ID
   */
  getClientById(id: string): Observable<Client | undefined> {
    const clientId = id || this.testClientId;
    
    if (this.useMockData) {
      return of(this.generateBasicMockClient(clientId)).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/{id}
    return this.http.get<ClientDTO>(`${this.clientApiUrl}/${clientId}`).pipe(
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error(`Erreur lors de la récupération du client ${clientId}:`, error);
        return of(this.generateBasicMockClient(clientId));
      })
    );
  }

  /**
   * Récupérer le client actuellement connecté
   */
  getCurrentClient(): Observable<Client | undefined> {
    return this.getClientById(this.testClientId);
  }

  /**
   * Récupérer un client par son numéro client
   */
  getClientByClientId(clientId: string): Observable<Client | undefined> {
    if (this.useMockData) {
      return of(this.generateBasicMockClient(clientId)).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/client-id/{clientId}
    return this.http.get<ClientDTO>(`${this.clientApiUrl}/client-id/${clientId}`).pipe(
      map(client => this.clientDtoToClient(client)),
      catchError(() => of(this.generateBasicMockClient(clientId)))
    );
  }

  /**
   * Récupérer un client par son email
   */
  getClientByEmail(email: string): Observable<Client | undefined> {
    if (this.useMockData) {
      const mockClient = this.generateBasicMockClient(`cl-${Date.now()}`);
      mockClient.email = email;
      return of(mockClient).pipe(delay(300));
    }
    
    // Pas d'endpoint direct pour email dans le controller fourni
    // On pourrait ajouter cette fonctionnalité ou chercher dans la liste complète
    return this.http.get<UserDTO>(`${this.userApiUrl}/email/${email}`).pipe(
      switchMap(user => {
        if (user && user.id) {
          // Si on trouve l'utilisateur, chercher le client associé
          return this.http.get<ClientDTO>(`${this.clientApiUrl}/user/${user.id}`);
        }
        throw new Error(`User with email ${email} not found`);
      }),
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error(`Erreur lors de la récupération du client par email ${email}:`, error);
        return of(this.generateBasicMockClient(`cl-${Date.now()}`));
      })
    );
  }

  /**
   * Récupérer un client par son ID utilisateur
   */
  getClientByUserId(userId: string): Observable<Client | undefined> {
    if (this.useMockData) {
      return of(this.generateBasicMockClient(userId)).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/user/{userId}
    return this.http.get<ClientDTO>(`${this.clientApiUrl}/user/${userId}`).pipe(
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error(`Erreur lors de la récupération du client par userId ${userId}:`, error);
        return of(this.generateBasicMockClient(userId));
      })
    );
  }

  /**
   * Récupérer les clients par statut
   */
  getClientsByStatus(status: string): Observable<Client[]> {
    if (this.useMockData) {
      const clients = this.generateBasicMockClients();
      return of(clients.filter(c => c.status === status)).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/status/{status}
    return this.http.get<ClientDTO[]>(`${this.clientApiUrl}/status/${status}`).pipe(
      map(clients => clients.map(client => this.clientDtoToClient(client))),
      catchError(() => {
        const clients = this.generateBasicMockClients();
        return of(clients.filter(c => c.status === status));
      })
    );
  }

  /**
   * Créer un client pour un utilisateur existant
   */
  createClientForUser(userId: string): Observable<Client> {
    if (this.useMockData) {
      const newClient = this.generateBasicMockClient(`${userId}-client`);
      return of(newClient).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/{userId} pour créer un client lié à un utilisateur existant
    return this.http.post<ClientDTO>(`${this.clientApiUrl}/${userId}`, {}).pipe(
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error('Erreur lors de la création du client:', error);
        return of(this.generateBasicMockClient(`${userId}-client`));
      })
    );
  }

  /**
   * Récupérer les comptes d'un client
   */
  getClientAccounts(clientId: string): Observable<Account[]> {
    const id = clientId || this.testClientId;
    
    if (this.useMockData) {
      return of(this.generateMockAccounts(id)).pipe(delay(300));
    }
    
    // Utiliser l'endpoint des comptes associé à l'utilisateur
    return this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${id}`).pipe(
      catchError(() => of(this.generateMockAccounts(id)))
    );
  }

  /**
   * Récupérer les comptes actifs d'un client
   */
  getActiveClientAccounts(clientId: string): Observable<Account[]> {
    const id = clientId || this.testClientId;
    
    if (this.useMockData) {
      const accounts = this.generateMockAccounts(id);
      return of(accounts.filter(a => a.status === 'active')).pipe(delay(300));
    }
    
    // Combiner la requête de tous les comptes avec un filtre
    return this.getClientAccounts(id).pipe(
      map(accounts => accounts.filter(account => account.status === 'active')),
      catchError(() => {
        const accounts = this.generateMockAccounts(id);
        return of(accounts.filter(a => a.status === 'active'));
      })
    );
  }

  /**
   * Récupérer un compte par ID
   */
  getAccountById(accountId: string): Observable<Account | undefined> {
    if (this.useMockData) {
      const accounts = this.generateMockAccounts(this.testClientId);
      return of(accounts.find(a => a.id === accountId)).pipe(delay(300));
    }
    
    return this.http.get<Account>(`${this.apiUrl}/accounts/${accountId}`).pipe(
      catchError(() => {
        // Utiliser l'ID client de test valide
        const accounts = this.generateMockAccounts(this.testClientId);
        return of(accounts.find(a => a.id === accountId));
      })
    );
  }

  /**
   * Créer un nouvel utilisateur client
   */
  createClient(clientData: ClientFormData): Observable<Client> {
    if (this.useMockData) {
      const newClient = this.generateBasicMockClient(`cl${Date.now()}`);
      if (clientData) {
        Object.assign(newClient, clientData);
      }
      return of(newClient).pipe(delay(300));
    }
    
    // Convertir les données de formulaire en format utilisateur
    const userData: UserDTO = {
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phoneNumber: clientData.phone,
      role: 'client',
      isActive: true,
      language: clientData.language || 'fr',
      identityType: clientData.identityType,
      identityNumber: clientData.identityNumber,
      passwordHash: clientData.password, // Le backend devrait hasher ce mot de passe
      twoFactorEnabled: false,
      twoFactorMethod: 'none',
      gdprConsent: clientData.gdprConsent || false
    };
    
    // Ce processus nécessite deux étapes : créer d'abord un utilisateur, puis un client
    return this.http.post<UserDTO>(`${this.userApiUrl}`, userData).pipe(
      switchMap(user => {
        // Une fois l'utilisateur créé, créer le client lié
        if (!user || !user.id) {
          throw new Error('Création de l\'utilisateur échouée');
        }
        
        // Utiliser l'endpoint pour créer un client lié à l'utilisateur
        return this.http.post<ClientDTO>(`${this.clientApiUrl}/${user.id}`, {});
      }),
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error('Erreur lors de la création du client:', error);
        const newClient = this.generateBasicMockClient(`cl${Date.now()}`);
        if (clientData) {
          Object.assign(newClient, clientData);
        }
        return of(newClient);
      })
    );
  }

  /**
   * Mettre à jour un client
   */
  updateClient(id: string, clientData: Partial<Client>): Observable<Client> {
    if (this.useMockData) {
      const client = this.generateBasicMockClient(id);
      const updatedClient = { ...client, ...clientData };
      return of(updatedClient).pipe(delay(300));
    }
    
    // Convertir les données client au format attendu par l'API
    const clientDto = this.clientToClientDto(clientData);
    
    return this.http.put<ClientDTO>(`${this.clientApiUrl}/${id}`, clientDto).pipe(
      map(client => this.clientDtoToClient(client)),
      catchError(error => {
        console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
        const client = this.generateBasicMockClient(id);
        const updatedClient = { ...client, ...clientData };
        return of(updatedClient);
      })
    );
  }

  /**
   * Supprimer un client
   */
  deleteClient(id: string): Observable<boolean> {
    if (this.useMockData) {
      return of(true).pipe(delay(300));
    }
    
    return this.http.delete<void>(`${this.clientApiUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(true))
    );
  }

  /**
   * Vérifier un client
   */
  verifyClient(id: string): Observable<boolean> {
    if (this.useMockData) {
      return of(true).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/{id}/verify
    return this.http.put<void>(`${this.clientApiUrl}/${id}/verify`, {}).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Mettre à jour le statut d'un client
   */
  updateClientStatus(id: string, status: string): Observable<boolean> {
    if (this.useMockData) {
      return of(true).pipe(delay(300));
    }
    
    // Utiliser l'endpoint /clients/{id}/status
    const params = new HttpParams().set('status', status);
    
    return this.http.put<void>(`${this.clientApiUrl}/${id}/status`, null, { params }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Mettre à jour le consentement GDPR
   */
  updateGdprConsent(id: string, consent: boolean): Observable<boolean> {
    if (this.useMockData) {
      return of(true).pipe(delay(300));
    }
    
    // Cette fonction n'a pas d'équivalent direct dans le controller fourni
    // On pourrait l'adapter pour utiliser updateClient
    const updates = { gdprConsent: consent };
    
    return this.updateClient(id, { gdprConsent: consent } as Partial<Client>).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Créer un nouveau compte (doit être géré par le AccountService)
   */
  createAccount(clientId: string, accountData: Partial<Account>): Observable<Account> {
    if (this.useMockData) {
      const client = this.generateBasicMockClient(clientId || this.testClientId);
      const newAccount: Account = {
        id: `acc${Date.now()}`,
        client: client,
        clientId: clientId || this.testClientId,
        accountNumber: Math.floor(Math.random() * 10000000000000000).toString(),
        type: accountData.type || 'current',
        balance: accountData.balance || 0,
        availableBalance: accountData.availableBalance || accountData.balance || 0,
        currency: accountData.currency || 'MAD',
        status: accountData.status || 'active',
        openedDate: new Date().toISOString(),
        lastTransactionDate: new Date().toISOString(),
        iban: `MA${Math.floor(Math.random() * 1000000000000000000)}`,
        rib: accountData.rib || '',
        dailyLimit: accountData.dailyLimit || 5000,
        monthlyLimit: accountData.monthlyLimit || 50000,
        isPrimary: accountData.isPrimary !== undefined ? accountData.isPrimary : false,
        interestRate: accountData.interestRate || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return of(newAccount).pipe(delay(300));
    }
    
    // Cette méthode reste inchangée car elle concerne les comptes
    const id = clientId || this.testClientId;
    const formattedAccountData = this.formatDates(accountData);
    
    return this.http.post<Account>(
      `${this.apiUrl}/accounts/${id}/${formattedAccountData.currency || 'MAD'}`, 
      formattedAccountData
    ).pipe(
      catchError(() => {
        const client = this.generateBasicMockClient(id);
        const newAccount: Account = {
          id: `acc${Date.now()}`,
          client: client,
          clientId: id,
          accountNumber: Math.floor(Math.random() * 10000000000000000).toString(),
          type: accountData.type || 'current',
          balance: accountData.balance || 0,
          availableBalance: accountData.availableBalance || accountData.balance || 0,
          currency: accountData.currency || 'MAD',
          status: accountData.status || 'active',
          openedDate: new Date().toISOString(),
          lastTransactionDate: new Date().toISOString(),
          iban: `MA${Math.floor(Math.random() * 1000000000000000000)}`,
          rib: accountData.rib || '',
          dailyLimit: accountData.dailyLimit || 5000,
          monthlyLimit: accountData.monthlyLimit || 50000,
          isPrimary: accountData.isPrimary !== undefined ? accountData.isPrimary : false,
          interestRate: accountData.interestRate || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return of(newAccount);
      })
    );
  }

  /**
   * Mettre à jour les informations d'un compte (doit être géré par le AccountService)
   */
  updateAccount(accountId: string, updates: Partial<Account>): Observable<Account> {
    if (this.useMockData) {
      const accounts = this.generateMockAccounts(this.testClientId);
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return of({} as Account).pipe(delay(300));
      }
      const updatedAccount = { ...account, ...updates, updatedAt: new Date().toISOString() };
      return of(updatedAccount).pipe(delay(300));
    }
    
    const formattedUpdates = this.formatDates(updates);
    
    return this.http.put<Account>(`${this.apiUrl}/accounts/${accountId}`, formattedUpdates).pipe(
      catchError(() => {
        // Utiliser l'ID client de test valide
        const accounts = this.generateMockAccounts(this.testClientId);
        const account = accounts.find(a => a.id === accountId);
        if (!account) {
          return of({} as Account);
        }
        const updatedAccount = { ...account, ...updates, updatedAt: new Date().toISOString() };
        return of(updatedAccount);
      })
    );
  }

  /**
   * Récupérer le tableau de bord complet du client
   */
  getClientDashboard(clientId?: string): Observable<any> {
    const id = clientId || this.testClientId;
    
    if (this.useMockData) {
      const client = this.generateBasicMockClient(id);
      const accounts = this.generateMockAccounts(id);
      const totalBalance = accounts.reduce((sum, account) => {
        return account.status === 'active' ? sum + account.balance : sum;
      }, 0);
      
      return of({
        client: {
          ...client,
          balance: totalBalance,
        },
        accounts,
        financialSummary: {
          totalBalance,
          totalBalanceChange: 2.5,
          monthlyIncome: client?.income || 0,
          monthlyIncomeChange: 1.2,
          monthlyExpenses: client?.income ? client.income * 0.6 : 0,
          monthlyExpensesChange: -0.8
        }
      }).pipe(delay(300));
    }
    
    return forkJoin({
      client: this.getClientById(id),
      accounts: this.getClientAccounts(id)
    }).pipe(
      map(results => {
        const { client, accounts } = results;
        
        if (!client) {
          throw new Error(`Client with ID ${id} not found`);
        }

        const totalBalance = accounts.reduce((sum, account) => {
          return account.status === 'active' ? sum + account.balance : sum;
        }, 0);

        return {
          client: {
            ...client,
            balance: totalBalance,
          },
          accounts,
          financialSummary: {
            totalBalance,
            totalBalanceChange: 2.5,
            monthlyIncome: client?.income || 0,
            monthlyIncomeChange: 1.2,
            monthlyExpenses: client?.income ? client.income * 0.6 : 0,
            monthlyExpensesChange: -0.8
          }
        };
      }),
      catchError(error => {
        console.error('Erreur dashboard', error);
        return of({
          client: this.generateBasicMockClient(id),
          accounts: this.generateMockAccounts(id),
          financialSummary: {
            totalBalance: 50000,
            totalBalanceChange: 2.5,
            monthlyIncome: 10000,
            monthlyIncomeChange: 1.2,
            monthlyExpenses: 6000,
            monthlyExpensesChange: -0.8
          }
        });
      })
    );
  }

  /**
   * Récupérer les clients récents (pour le tableau de bord de l'agent)
   * @param limit Nombre maximum de clients à retourner
   */
  getRecentClients(limit: number = 5): Observable<Client[]> {
    if (this.useMockData) {
      // Générer des données mock en cas d'erreur
      const mockClients = this.generateBasicMockClients();
      
      // Ajouter quelques variantes pour plus de réalisme
      const mockVariants = [
        {
          firstName: 'Mohammed',
          lastName: 'Alaoui',
          email: 'mohammed.alaoui@example.com',
          phone: '+212611223344',
          city: 'Casablanca',
          dateJoined: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Hier
          identityType: 'CIN',
          accountType: 'Premium'
        },
        {
          firstName: 'Fatima',
          lastName: 'Benali',
          email: 'fatima.benali@example.com',
          phone: '+212622334455',
          city: 'Rabat',
          dateJoined: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 jours
          identityType: 'Passport',
          accountType: 'Gold'
        },
        {
          firstName: 'Youssef',
          lastName: 'El Mansouri',
          email: 'youssef.elmansouri@example.com',
          phone: '+212633445566',
          city: 'Marrakech',
          dateJoined: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 jours
          identityType: 'CIN',
          accountType: 'Student'
        }
      ];
      
      // Appliquer les variantes aux clients mock
      mockVariants.forEach((variant, index) => {
        if (index < mockClients.length) {
          Object.assign(mockClients[index], variant);
        }
      });
      
      // Trier par date d'inscription (du plus récent au plus ancien)
      mockClients.sort((a, b) => {
        const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
        const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
        return dateB - dateA;
      });
      
      return of(mockClients.slice(0, limit)).pipe(delay(300));
    }
    
    // Utiliser l'API clients et trier par date de création
    return this.http.get<ClientDTO[]>(`${this.clientApiUrl}`).pipe(
      map(clients => {
        // Convertir les DTOs en clients
        return clients
          .map(client => this.clientDtoToClient(client))
          // Trier par date d'inscription (du plus récent au plus ancien)
          .sort((a, b) => {
            const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
            const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, limit);
      }),
      catchError(() => {
        // Générer des données mock en cas d'erreur
        const mockClients = this.generateBasicMockClients();
        
        // Ajouter quelques variantes pour plus de réalisme
        const mockVariants = [
          { firstName: 'Mohammed', lastName: 'Alaoui', dateJoined: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { firstName: 'Fatima', lastName: 'Benali', dateJoined: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { firstName: 'Youssef', lastName: 'El Mansouri', dateJoined: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
        ];
        
        // Appliquer les variantes aux clients mock
        mockVariants.forEach((variant, index) => {
          if (index < mockClients.length) {
            Object.assign(mockClients[index], variant);
          }
        });
        
        return of(mockClients.slice(0, limit));
      }),
      delay(300) // Simuler un délai réseau
    );
  }

  // Méthodes utilitaires pour la conversion entre DTOs et modèles
  
  /**
   * Convertir un UserDTO en objet Client
   */
  private userDtoToClient(userDto: UserDTO): Client {
    if (!userDto) {
      console.warn('UserDTO est null ou undefined');
      return this.generateBasicMockClient('unknown');
    }
    
    // Créer un objet Client à partir d'un UserDTO
    return {
      id: userDto.id || '',
      firstName: userDto.firstName || '',
      lastName: userDto.lastName || '',
      email: userDto.email || '',
      phone: userDto.phoneNumber || '',
      clientId: userDto.id || '',
      status: userDto.isActive ? 'active' : 'inactive',
      identityNumber: userDto.identityNumber || '',
      identityType: userDto.identityType || '',
      dateJoined: userDto.createdAt || new Date().toISOString(),
      createdAt: userDto.createdAt || new Date().toISOString(),
      updatedAt: userDto.updatedAt || new Date().toISOString(),
      
      // Ces propriétés ne sont pas directement disponibles dans UserDTO
      address: '',
      city: '',
      postalCode: '',
      country: '',
      accountType: 'Standard',
      balance: 0,
      currency: 'MAD',
      birthDate: '',
      occupation: '',
      income: 0,
      contactPreference: userDto.twoFactorMethod || 'Email',
      language: userDto.language || 'fr',
      gdprConsent: userDto.gdprConsent
    };
  }
  
  /**
   * Convertir un ClientDTO en objet Client
   */
  private clientDtoToClient(clientDto: ClientDTO): Client {
    if (!clientDto) {
      console.warn('ClientDTO est null ou undefined');
      return this.generateBasicMockClient('unknown');
    }
    
    // Créer un objet Client à partir d'un ClientDTO
    return {
      id: clientDto.id || '',
      firstName: clientDto.firstName || '',
      lastName: clientDto.lastName || '',
      email: clientDto.email || '',
      phone: clientDto.phoneNumber || '',
      clientId: clientDto.clientId || clientDto.id || '',
      status: clientDto.status || 'active',
      identityNumber: clientDto.identityNumber || '',
      identityType: clientDto.identityType || '',
      dateJoined: clientDto.createdAt || new Date().toISOString(),
      createdAt: clientDto.createdAt || new Date().toISOString(),
      updatedAt: clientDto.updatedAt || new Date().toISOString(),
      address: clientDto.address || '',
      city: clientDto.city || '',
      postalCode: clientDto.postalCode || '',
      country: clientDto.country || '',
      accountType: clientDto.accountType || 'Standard',
      balance: clientDto.balance || 0,
      currency: clientDto.currency || 'MAD',
      birthDate: clientDto.birthDate || '',
      occupation: clientDto.occupation || '',
      income: clientDto.income || 0,
      contactPreference: clientDto.contactPreference || 'Email',
      language: clientDto.language || 'fr',
      gdprConsent: clientDto.gdprConsent
    };
  }

  /**
   * Convertir les données Client en UserDTO pour la mise à jour
   */
  private clientToUserDtoUpdate(clientData: Partial<Client>): Partial<UserDTO> {
    return {
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phoneNumber: clientData.phone,
      isActive: clientData.status === 'active',
      identityType: clientData.identityType,
      identityNumber: clientData.identityNumber,
      language: clientData.language || 'fr'
    };
  }
  
  /**
   * Convertir les données Client en ClientDTO pour la mise à jour
   */
  private clientToClientDto(clientData: Partial<Client>): Partial<ClientDTO> {
    return {
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phoneNumber: clientData.phone,
      status: clientData.status,
      identityType: clientData.identityType,
      identityNumber: clientData.identityNumber,
      address: clientData.address,
      city: clientData.city,
      postalCode: clientData.postalCode,
      country: clientData.country,
      accountType: clientData.accountType,
      birthDate: clientData.birthDate instanceof Date ? clientData.birthDate.toISOString() : clientData.birthDate,
      occupation: clientData.occupation,
      income: clientData.income,
      contactPreference: clientData.contactPreference,
      language: clientData.language
    };
  }

  // Les méthodes de génération de données mock restent inchangées
  
  /**
   * Générer un client mocké simple
   */
  private generateBasicMockClient(id: string): Client {
    return {
      id: id,
      firstName: 'Ahmed',
      lastName: 'Bennani',
      email: 'ahmed.bennani@email.com',
      phone: '+212 600000000',
      clientId: `CLI${id.substring(0, 6)}`,
      address: '123 Avenue Mohammed V',
      city: 'Casablanca',
      postalCode: '20000',
      country: 'Maroc',
      status: 'active',
      accountType: 'Premium',
      balance: 75000,
      currency: 'MAD',
      dateJoined: new Date().toISOString(),
      identityNumber: 'BE123456',
      identityType: 'CIN',
      birthDate: '1985-01-01',
      occupation: 'Ingénieur',
      income: 25000,
      contactPreference: 'Email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: 'fr',
      gdprConsent: true
    };
  }
  
  /**
   * Générer plusieurs clients mockés
   */
  private generateBasicMockClients(): Client[] {
    return [
      // Utiliser l'ID client de test valide et des variantes
      this.generateBasicMockClient(this.testClientId),
      this.generateBasicMockClient(`${this.testClientId}-2`),
      this.generateBasicMockClient(`${this.testClientId}-3`)
    ];
  }

  /**
   * Générer des comptes mockés pour un client
   */
  private generateMockAccounts(clientId: string): Account[] {
    const client = this.generateBasicMockClient(clientId);
    
    return [
      {
        id: `acc${clientId.substring(0, 6)}1`,
        client: client,
        clientId: clientId,
        accountNumber: '001234567890',
        type: 'current',
        balance: 50000,
        availableBalance: 49000,
        currency: 'MAD',
        status: 'active',
        openedDate: new Date().toISOString(),
        lastTransactionDate: new Date().toISOString(),
        iban: 'MA64001234567890123456789',
        rib: 'RIB12345',
        dailyLimit: 10000,
        monthlyLimit: 50000,
        isPrimary: true,
        interestRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `acc${clientId.substring(0, 6)}2`,
        client: client,
        clientId: clientId,
        accountNumber: '001234567891',
        type: 'savings',
        balance: 25000,
        availableBalance: 25000,
        currency: 'MAD',
        status: 'active',
        openedDate: new Date().toISOString(),
        lastTransactionDate: new Date().toISOString(),
        iban: 'MA64001234567891123456789',
        rib: 'RIB54321',
        dailyLimit: 5000,
        monthlyLimit: 20000,
        isPrimary: false,
        interestRate: 2.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Liste des villes disponibles (pour dropdowns)
   */
  getCities(): Observable<string[]> {
    return of([
      'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 
      'Oujda', 'Meknes', 'Kenitra', 'Tetouan', 'El Jadida', 'Safi', 
      'Mohammedia', 'Essaouira', 'Nador'
    ]).pipe(delay(300));
  }

  /**
   * Types de compte disponibles (pour dropdowns)
   */
  getAccountTypes(): Observable<string[]> {
    return of([
      'Standard', 'Premium', 'Gold', 'Platinum', 'Student'
    ]).pipe(delay(300));
  }

  /**
   * Devises disponibles (pour dropdowns)
   */
  getCurrencies(): Observable<string[]> {
    return of([
      'MAD', 'EUR', 'USD', 'GBP'
    ]).pipe(delay(300));
  }

  /**
   * Catégories de compte disponibles (pour dropdowns)
   */
  getAccountCategories(): Observable<string[]> {
    return of([
      'current', 'savings', 'investment', 'fixed', 'other'
    ]).pipe(delay(300));
  }
}

// Interface définissant la structure du DTO utilisateur retourné par l'API
interface UserDTO {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  language?: string;
  gdprConsent?: boolean;
  gdprConsentDate?: string;
  identityType?: string;
  identityNumber?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  passwordHash?: string;
}

// Interface définissant la structure du DTO client retourné par l'API
interface ClientDTO {
  id?: string;
  userId?: string;
  clientId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  identityNumber?: string;
  identityType?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  accountType?: string;
  balance?: number;
  currency?: string;
  birthDate?: string;
  occupation?: string;
  income?: number;
  contactPreference?: string;
  language?: string;
  gdprConsent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}