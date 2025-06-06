import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces locales
interface StripeAccount {
  id: string;
  email: string;
  country: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboarding_url?: string;
  type: string;
  localAccount: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
}

interface StripeAccountCreationResponse {
  stripe_account_id: string;
  onboarding_url: string;
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

interface ClientAccount {
  id: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: string;
  iban: string;
}

@Component({
  selector: 'app-stripe-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stripe-management.component.html',
  styleUrls: ['./stripe-management.component.css']
})
export class StripeManagementComponent implements OnInit {
  // Focus on single user like client page
  userId = '31f102f4-f7ac-4dce-84bc-ed580a7661b9';
  clientId = '65e418f7-1711-479b-8e32-3c780730640e';
  
  // Real user data from database
  client: any = null;
  clientName: string = '';
  
  // User's Stripe account data
  userStripeAccount: StripeAccount | null = null;
  userStripeBalance: StripeBalance | null = null;
  
  // Loading states
  isLoading = false;
  isCreatingAccount = false;
  isLoadingBalance = false;
  isRefreshingLink = false;
  isSyncing = false;
  
  // Messages
  error: string | null = null;
  success: string | null = null;
  
  // API URLs
  private apiUrl = 'http://localhost:8085/E-BANKING1/api/stripe';
  private clientApiUrl = 'http://localhost:8085/E-BANKING1/api';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for success/refresh parameters from Stripe redirect
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        this.success = 'Configuration Stripe terminée! Actualisation des données...';
        // Force refresh after success
        setTimeout(() => {
          this.forceRefreshStripeData();
        }, 1000);
      } else if (params['refresh'] === 'true') {
        this.error = 'Configuration interrompue. Vous pouvez reprendre le processus.';
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
    
    this.loadClientData();
  }

  /**
   * Charger les données du client depuis la base de données
   */
  loadClientData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get(`${this.clientApiUrl}/clients/${this.clientId}`)
      .pipe(
        tap((response: any) => {
          if (Array.isArray(response) && response.length > 0) {
            this.client = response[0];
          } else {
            this.client = response;
          }
          
          this.clientName = this.client.username || 'Client';
          
          // Une fois les données client chargées, charger le compte Stripe
          this.loadUserStripeData();
        }),
        catchError(err => {
          console.error('Erreur lors du chargement du client:', err);
          this.error = 'Impossible de charger les données client';
          // Fallback avec données statiques si erreur
          this.createFallbackData();
          this.loadUserStripeData();
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Créer des données de fallback en cas d'erreur
   */
  createFallbackData(): void {
    this.client = {
      id: this.userId,
      username: 'Mohammed Alami',
      email: 'mohammed.alami@example.com',
      firstName: 'Mohammed',
      lastName: 'Alami'
    };
    
    this.clientName = 'Mohammed Alami';
  }

  /**
   * Charger les données Stripe de l'utilisateur avec cache-busting
   */
  loadUserStripeData(forceRefresh: boolean = false): void {
    // Add timestamp to prevent caching
    const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
    
    this.http.get<StripeAccount>(`${this.apiUrl}/byuserid/${this.userId}${cacheBuster}`)
      .pipe(
        tap((account: StripeAccount) => {
          console.log('Données Stripe reçues:', account);
          this.userStripeAccount = account;
          
          // Si l'utilisateur a un compte Stripe, charger aussi le solde
          if (account) {
            this.loadUserBalance();
          }
        }),
        catchError(err => {
          console.error('Utilisateur sans compte Stripe ou erreur:', err);
          this.userStripeAccount = null;
          // Ce n'est pas forcément une erreur si l'utilisateur n'a pas de compte
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
  }

  /**
   * Force refresh des données Stripe (utilisé après onboarding)
   */
  forceRefreshStripeData(): void {
    this.isSyncing = true;
    this.error = null;
    
    // Clear existing data first
    this.userStripeAccount = null;
    
    // Add a delay to ensure backend has processed the webhook
    setTimeout(() => {
      this.loadUserStripeData(true);
      this.success = 'Données Stripe actualisées avec succès!';
      setTimeout(() => {
        this.success = null;
        this.isSyncing = false;
      }, 3000);
    }, 2000);
  }

  /**
   * Créer un compte Stripe pour l'utilisateur
   */
  createStripeAccount(): void {
    this.isCreatingAccount = true;
    this.error = null;
    this.success = null;

    this.http.post<StripeAccountCreationResponse>(`${this.apiUrl}/create-account/${this.userId}`, {})
      .pipe(
        tap((response: StripeAccountCreationResponse) => {
          this.success = 'Compte Stripe créé avec succès! Redirection vers la configuration...';
          
          // Redirect to Stripe onboarding (will come back to our app)
          if (response.onboarding_url) {
            window.location.href = response.onboarding_url;
          }
        }),
        catchError(err => {
          console.error('Erreur lors de la création du compte Stripe:', err);
          this.error = err.error?.message || err.error || 'Erreur lors de la création du compte Stripe';
          return of(null);
        }),
        finalize(() => {
          this.isCreatingAccount = false;
        })
      )
      .subscribe();
  }

  /**
   * Charger le solde Stripe de l'utilisateur
   */
  loadUserBalance(): void {
    this.isLoadingBalance = true;
    
    this.http.get<StripeBalance>(`${this.apiUrl}/balance/${this.userId}`)
      .pipe(
        tap((balance: StripeBalance) => {
          this.userStripeBalance = balance;
        }),
        catchError(err => {
          console.error('Erreur lors du chargement du solde:', err);
          this.userStripeBalance = null;
          return of(null);
        }),
        finalize(() => {
          this.isLoadingBalance = false;
        })
      )
      .subscribe();
  }

  /**
   * Rafraîchir le lien d'onboarding
   */
  refreshOnboardingLink(): void {
    this.isRefreshingLink = true;
    this.error = null;
    
    this.http.get<StripeAccountCreationResponse>(`${this.apiUrl}/refresh-link/${this.userId}`)
      .pipe(
        tap((response: StripeAccountCreationResponse) => {
          if (response.onboarding_url) {
            window.location.href = response.onboarding_url;
          }
        }),
        catchError(err => {
          console.error('Erreur lors du rafraîchissement du lien:', err);
          this.error = 'Erreur lors du rafraîchissement du lien d\'onboarding';
          return of(null);
        }),
        finalize(() => {
          this.isRefreshingLink = false;
        })
      )
      .subscribe();
  }

  /**
   * Synchroniser les données Stripe avec les données locales
   */
  syncStripeAccount(): void {
    this.isSyncing = true;
    this.error = null;
    
    this.http.post(`${this.apiUrl}/sync/${this.userId}`, {})
      .pipe(
        tap((response: any) => {
          this.success = 'Données Stripe synchronisées avec succès!';
          // Force refresh after sync
          this.loadUserStripeData(true);
          setTimeout(() => {
            this.success = null;
          }, 3000);
        }),
        catchError(err => {
          console.error('Erreur lors de la synchronisation:', err);
          this.error = 'Erreur lors de la synchronisation des données Stripe';
          return of(null);
        }),
        finalize(() => {
          this.isSyncing = false;
        })
      )
      .subscribe();
  }

  /**
   * Vérifier le statut du compte avec mise à jour
   */
  checkAccountStatus(): void {
    if (!this.userStripeAccount) return;
    
    // Force refresh to get latest data
    this.forceRefreshStripeData();
  }

  /**
   * Actualiser toutes les données
   */
  refreshAllData(): void {
    this.clearMessages();
    this.loadClientData();
    // Force refresh of Stripe data
    if (this.userStripeAccount) {
      this.loadUserStripeData(true);
    }
  }

  /**
   * Vérifier si le compte Stripe est complètement configuré
   */
  isAccountFullySetup(): boolean {
    if (!this.userStripeAccount) return false;
    console.log('Checking account status:', {
      chargesEnabled: this.userStripeAccount.chargesEnabled,
      payoutsEnabled: this.userStripeAccount.payoutsEnabled,
      detailsSubmitted: this.userStripeAccount.detailsSubmitted
    });
    return this.userStripeAccount.chargesEnabled && 
           this.userStripeAccount.payoutsEnabled && 
           this.userStripeAccount.detailsSubmitted;
  }

  /**
   * Obtenir la classe CSS pour le statut du compte
   */
  getAccountStatusClass(): string {
    if (!this.userStripeAccount) return 'bg-gray-100 text-gray-800';
    
    if (this.isAccountFullySetup()) {
      return 'bg-green-100 text-green-800';
    } else if (this.userStripeAccount.detailsSubmitted) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  }

  /**
   * Obtenir le texte du statut du compte
   */
  getAccountStatusText(): string {
    if (!this.userStripeAccount) return 'Aucun compte';
    
    if (this.isAccountFullySetup()) {
      return 'Compte actif';
    } else if (this.userStripeAccount.detailsSubmitted) {
      return 'En cours de vérification';
    } else {
      return 'Configuration incomplète';
    }
  }

  /**
   * Formater le solde pour l'affichage
   */
  formatBalance(): string {
    if (!this.userStripeBalance || !this.userStripeBalance.available || this.userStripeBalance.available.length === 0) {
      return '0.00 EUR';
    }
    
    const available = this.userStripeBalance.available[0];
    const amount = available.amount / 100; // Stripe utilise les centimes
    return `${amount.toFixed(2)} ${available.currency.toUpperCase()}`;
  }

  /**
   * Formater le solde en attente
   */
  formatPendingBalance(): string {
    if (!this.userStripeBalance || !this.userStripeBalance.pending || this.userStripeBalance.pending.length === 0) {
      return '0.00 EUR';
    }
    
    const pending = this.userStripeBalance.pending[0];
    const amount = pending.amount / 100;
    return `${amount.toFixed(2)} ${pending.currency.toUpperCase()}`;
  }

  /**
   * Effacer les messages
   */
  clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  /**
   * Obtenir l'icône pour le statut du compte
   */
  getStatusIcon(): string {
    if (!this.userStripeAccount) return 'fa-times-circle';
    
    if (this.isAccountFullySetup()) {
      return 'fa-check-circle';
    } else if (this.userStripeAccount.detailsSubmitted) {
      return 'fa-clock';
    } else {
      return 'fa-exclamation-triangle';
    }
  }

  /**
   * Vérifier si l'utilisateur a un compte Stripe
   */
  hasStripeAccount(): boolean {
    return this.userStripeAccount !== null;
  }

  /**
   * Obtenir le nom complet du client
   */
  getClientFullName(): string {
    if (!this.client) return 'Client';
    
    if (this.client.firstName && this.client.lastName) {
      return `${this.client.firstName} ${this.client.lastName}`;
    }
    
    return this.client.username || this.clientName || 'Client';
  }

  /**
   * Obtenir l'email du client
   */
  getClientEmail(): string {
    return this.client?.email || 'email@example.com';
  }
}