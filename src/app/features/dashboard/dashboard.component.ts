import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsService } from '../../services/account/accounts.service';
import { TransactionsService } from '../../services/transaction/transactions.service';
import { AuthService } from '../../services/auth/auth.service';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-dashboard',
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Demo Dashboard</h1>
        <div>
          <button class="px-3 py-1 mr-2 border rounded" (click)="goToLogin()">Login</button>
          <button class="px-3 py-1 bg-red-600 text-white rounded" (click)="logout()">Logout</button>
        </div>
      </div>

      <section class="mb-6">
        <h2 class="font-semibold mb-2">Accounts</h2>
        <ul>
          <li *ngFor="let a of accounts$ | async" class="mb-2 p-2 border rounded">{{ a?.name }} — {{ a?.balance | json }}</li>
        </ul>
      </section>

      <section>
        <h2 class="font-semibold mb-2">Recent Transactions</h2>
        <ul>
          <li *ngFor="let t of transactions$ | async" class="mb-2 p-2 border rounded">{{ t?.description }} — {{ t?.amount }}</li>
        </ul>
      </section>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  accounts$!: Observable<any[]>;
  transactions$!: Observable<any[]>;

  constructor(
    private accounts: AccountsService,
    private tx: TransactionsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.accounts$ = this.accounts.listAccounts();
    // For demo, list recent transactions for the first seeded account (a1)
    this.transactions$ = this.tx.listTransactionsForAccount('a1');
  }

  logout() {
    this.auth.signOut().subscribe(() => window.location.reload());
  }

  goToLogin() {
    window.location.href = '/auth/login';
  }
}
