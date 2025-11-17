import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

// Seeded mock users, accounts and transactions for demo purposes
const MOCK_USERS = [
  { id: 'u1', email: 'demo@bank.test', password: 'password', displayName: 'Demo User' }
];

const MOCK_ACCOUNTS = [
  { id: 'a1', name: 'Checking Account', balance: 1250.5, ownerId: 'u1', createdAt: new Date().toISOString() },
  { id: 'a2', name: 'Savings Account', balance: 8200.0, ownerId: 'u1', createdAt: new Date().toISOString() }
];

const MOCK_TRANSACTIONS = [
  { id: 't1', accountId: 'a1', description: 'Coffee Shop', amount: -3.5, createdAt: new Date().toISOString() },
  { id: 't2', accountId: 'a1', description: 'Salary', amount: 2500.0, createdAt: new Date().toISOString() },
  { id: 't3', accountId: 'a2', description: 'Interest', amount: 5.75, createdAt: new Date().toISOString() }
];

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private users = MOCK_USERS.slice();
  private accounts = MOCK_ACCOUNTS.slice();
  private transactions = MOCK_TRANSACTIONS.slice();

  private currentUser$ = new BehaviorSubject<any | null>(null);

  getUsers() { return this.users; }

  findUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }

  signIn(email: string, password: string) {
    const u = this.findUserByEmail(email);
    if (u && u.password === password) {
      this.currentUser$.next({ id: u.id, email: u.email, displayName: u.displayName });
      return of({ id: u.id, email: u.email, displayName: u.displayName });
    }
    throw new Error('Invalid credentials');
  }

  signUp(email: string, password: string, displayName?: string) {
    const exists = this.findUserByEmail(email);
    if (exists) throw new Error('User already exists');
    const id = `u${Date.now()}`;
    const user = { id, email, password, displayName: displayName || email };
    this.users.push(user);
    this.currentUser$.next({ id: user.id, email: user.email, displayName: user.displayName });
    return of({ id: user.id, email: user.email, displayName: user.displayName });
  }

  signOut() {
    this.currentUser$.next(null);
    return of(null);
  }

  getCurrentUser$(): Observable<any | null> {
    return this.currentUser$.asObservable();
  }

  getIdToken(): Promise<string | null> {
    const user = this.currentUser$.value;
    return Promise.resolve(user ? `mock-token-${user.id}` : null);
  }

  listAccounts() { return of(this.accounts.slice()); }

  createAccount(account: any) {
    const id = `a${Date.now()}`;
    const acc = { id, ...account, createdAt: new Date().toISOString() };
    this.accounts.unshift(acc);
    return of(acc);
  }

  listTransactionsForAccount(accountId: string) {
    return of(this.transactions.filter(t => t.accountId === accountId));
  }

  createTransaction(tx: any) {
    const id = `t${Date.now()}`;
    const item = { id, ...tx, createdAt: new Date().toISOString() };
    this.transactions.unshift(item);
    return of(item);
  }
}
