import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface StripeAccount {
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
  };
}

export interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
  }>;
}

export interface StripeAccountCreationResponse {
  stripe_account_id: string;
  onboarding_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl = 'http://localhost:8085/E-BANKING1/api/stripe';
  private stripeAccountsSubject = new BehaviorSubject<StripeAccount[]>([]);
  public stripeAccounts$ = this.stripeAccountsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Créer un compte Stripe pour un utilisateur
   */
  createStripeAccount(userId: string): Observable<StripeAccountCreationResponse> {
    return this.http.post<StripeAccountCreationResponse>(`${this.apiUrl}/create-account/${userId}`, {})
      .pipe(
        tap(response => {
          console.log('Stripe account created:', response);
          this.loadAllStripeAccounts(); // Refresh the list
        }),
        catchError(error => {
          console.error('Error creating Stripe account:', error);
          throw error;
        })
      );
  }

  /**
   * Récupérer tous les comptes Stripe
   */
  getAllStripeAccounts(): Observable<StripeAccount[]> {
    return this.http.get<StripeAccount[]>(`${this.apiUrl}`)
      .pipe(
        tap(accounts => {
          this.stripeAccountsSubject.next(accounts);
        }),
        catchError(error => {
          console.error('Error loading Stripe accounts:', error);
          return of([]);
        })
      );
  }

  /**
   * Récupérer le compte Stripe d'un utilisateur
   */
  getStripeAccountByUserId(userId: string): Observable<StripeAccount | null> {
    return this.http.get<StripeAccount>(`${this.apiUrl}/byuserid/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error loading user Stripe account:', error);
          return of(null);
        })
      );
  }

  /**
   * Rafraîchir le lien d'onboarding
   */
  refreshOnboardingLink(userId: string): Observable<StripeAccountCreationResponse> {
    return this.http.get<StripeAccountCreationResponse>(`${this.apiUrl}/refresh-link/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error refreshing onboarding link:', error);
          throw error;
        })
      );
  }

  /**
   * Récupérer le solde Stripe d'un utilisateur
   */
  getUserStripeBalance(userId: string): Observable<StripeBalance> {
    return this.http.get<StripeBalance>(`${this.apiUrl}/balance/${userId}`)
      .pipe(
        catchError(error => {
          console.error('Error loading Stripe balance:', error);
          throw error;
        })
      );
  }

  /**
   * Vérifier le statut d'un compte Stripe
   */
  checkStripeAccountStatus(accountId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/success/${accountId}`, { responseType: 'text' })
      .pipe(
        catchError(error => {
          console.error('Error checking Stripe account status:', error);
          return of('Erreur lors de la vérification du statut');
        })
      );
  }

  /**
   * Charger tous les comptes Stripe (méthode privée)
   */
  private loadAllStripeAccounts(): void {
    this.getAllStripeAccounts().subscribe();
  }

  /**
   * Formater le solde pour l'affichage
   */
  formatBalance(balance: StripeBalance): string {
    if (!balance.available || balance.available.length === 0) {
      return '0.00 EUR';
    }
    
    const available = balance.available[0];
    const amount = available.amount / 100; // Stripe utilise les centimes
    return `${amount.toFixed(2)} ${available.currency.toUpperCase()}`;
  }

  /**
   * Vérifier si un compte Stripe est complètement configuré
   */
  isAccountFullySetup(account: StripeAccount): boolean {
    return account.chargesEnabled && account.payoutsEnabled && account.detailsSubmitted;
  }
}