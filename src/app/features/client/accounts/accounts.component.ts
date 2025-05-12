import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../services/account/account.service';
import { Account } from '../../../shared/models/account.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  // ID client fixe pour les tests (sera remplacé par l'authentification)
  clientId: string = 'client1';
  
  // Données d'affichage
  accounts: Account[] = [];
  totalBalance: number = 0;
  isLoading: boolean = true;
  selectedCurrency: string = 'MAD';
  Math = Math; // Pour pouvoir utiliser Math dans le template
  // Nouveau compte
  showNewAccountForm: boolean = false;
  newAccountData = {
    type: 'current' as 'current' | 'savings' | 'investment' | 'fixed' | 'other',
    currency: 'MAD',
    initialDeposit: 0
  };
  
  // Transfert rapide
  showQuickTransferForm: boolean = false;
  quickTransfer = {
    sourceAccountId: '',
    destinationAccountId: '',
    amount: 0,
    description: ''
  };
  
  // État des actions
  isCreatingAccount: boolean = false;
  isTransferring: boolean = false;
  transferSuccess: boolean = false;
  errorMessage: string = '';

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccountData();
  }

  loadAccountData(): void {
  this.isLoading = true;
  this.accountService.getClientAccounts(this.clientId).subscribe({
    next: (accounts) => {
      // Calculer le solde disponible pour chaque compte
      this.accounts = accounts.map(account => {
        // Logique simple pour le solde disponible: 
        // Pour les comptes courants, garder une réserve minimum de 200
        // Pour les autres types, tout le solde est disponible
        if (!account.availableBalance) {
          if (account.type === 'current') {
            account.availableBalance = Math.max(0, account.balance - 200);
          } else {
            account.availableBalance = account.balance;
          }
        }
        return account;
      });
      
      this.calculateTotalBalance();
      
      // Préselectionner le compte source par défaut s'il existe des comptes
      if (this.accounts.length > 0) {
        this.quickTransfer.sourceAccountId = this.accounts[0].id;
      }
      
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur lors du chargement des comptes', err);
      this.errorMessage = 'Impossible de charger vos comptes. Veuillez réessayer plus tard.';
      this.isLoading = false;
    }
  });
}

  calculateTotalBalance(): void {
    // Pour une application réelle, il faudrait gérer les conversions de devises
    this.totalBalance = this.accounts.reduce((total, account) => {
      if (account.currency === this.selectedCurrency) {
        return total + account.balance;
      }
      // Simulation simple de conversion - à remplacer par un service de conversion réel
      const conversionRates: Record<string, number> = {
        'MAD': 1,
        'EUR': 10.8,
        'USD': 10.0,
        'GBP': 12.6
      };
      
      const rate = conversionRates[account.currency] / conversionRates[this.selectedCurrency];
      return total + (account.balance * rate);
    }, 0);
  }
  
  toggleNewAccountForm(): void {
    this.showNewAccountForm = !this.showNewAccountForm;
    if (!this.showNewAccountForm) {
      // Réinitialiser le formulaire quand on le ferme
      this.newAccountData = {
        type: 'current',
        currency: 'MAD',
        initialDeposit: 0
      };
    }
  }
  
  toggleQuickTransferForm(): void {
    this.showQuickTransferForm = !this.showQuickTransferForm;
    this.transferSuccess = false;
    if (!this.showQuickTransferForm) {
      // Réinitialiser le formulaire quand on le ferme
      this.quickTransfer = {
        sourceAccountId: this.accounts.length > 0 ? this.accounts[0].id : '',
        destinationAccountId: '',
        amount: 0,
        description: ''
      };
    }
  }
  
  createNewAccount(): void {
    if (this.isCreatingAccount) return;
    
    this.isCreatingAccount = true;
    this.errorMessage = '';
    
    this.accountService.createAccount(
      this.clientId, 
      this.newAccountData
    ).subscribe({
      next: (newAccount) => {
        // Ajouter le compte à la liste
        this.accounts.push(newAccount);
        this.calculateTotalBalance();
        
        // Réinitialiser le formulaire et le fermer
        this.toggleNewAccountForm();
        this.isCreatingAccount = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création du compte', err);
        this.errorMessage = 'Impossible de créer le compte. Veuillez réessayer.';
        this.isCreatingAccount = false;
      }
    });
  }
  
  performQuickTransfer(): void {
    if (this.isTransferring) return;
    
    // Vérifications de base
    if (
      this.quickTransfer.sourceAccountId === this.quickTransfer.destinationAccountId ||
      this.quickTransfer.amount <= 0 ||
      !this.quickTransfer.sourceAccountId ||
      !this.quickTransfer.destinationAccountId
    ) {
      this.errorMessage = 'Veuillez vérifier les informations de transfert';
      return;
    }
    
    const sourceAccount = this.accounts.find(a => a.id === this.quickTransfer.sourceAccountId);
    if (sourceAccount && sourceAccount.balance < this.quickTransfer.amount) {
      this.errorMessage = 'Solde insuffisant pour effectuer ce transfert';
      return;
    }
    
    this.isTransferring = true;
    this.errorMessage = '';
    
    this.accountService.transferBetweenAccounts(
      this.quickTransfer.sourceAccountId,
      this.quickTransfer.destinationAccountId,
      this.quickTransfer.amount,
      this.quickTransfer.description
    ).subscribe({
      next: (result) => {
        // Mettre à jour les soldes dans notre liste de comptes locale
        const sourceIndex = this.accounts.findIndex(a => a.id === this.quickTransfer.sourceAccountId);
        const destIndex = this.accounts.findIndex(a => a.id === this.quickTransfer.destinationAccountId);
        
        if (sourceIndex >= 0) {
          this.accounts[sourceIndex].balance = result.sourceAccount.balance;
          this.accounts[sourceIndex].lastTransactionDate = result.sourceAccount.lastTransactionDate;
        }
        
        if (destIndex >= 0) {
          this.accounts[destIndex].balance = result.destinationAccount.balance;
          this.accounts[destIndex].lastTransactionDate = result.destinationAccount.lastTransactionDate;
        }
        
        this.calculateTotalBalance();
        this.isTransferring = false;
        this.transferSuccess = true;
        
        // Réinitialiser le formulaire après 3 secondes
        setTimeout(() => {
          this.transferSuccess = false;
          this.toggleQuickTransferForm();
        }, 3000);
      },
      error: (err) => {
        console.error('Erreur lors du transfert', err);
        this.errorMessage = 'Impossible d\'effectuer le transfert. Veuillez réessayer.';
        this.isTransferring = false;
      }
    });
  }
  
  getAccountTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'current': 'Compte courant',
      'savings': 'Compte épargne',
      'investment': 'Compte d\'investissement',
      'fixed': 'Dépôt à terme',
      'other': 'Autre'
    };
    return types[type] || type;
  }
  
  getAccountStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getAccountTypeIcon(type: string): string {
    switch (type) {
      case 'current': return 'fa-solid fa-wallet';
      case 'savings': return 'fa-solid fa-piggy-bank';
      case 'investment': return 'fa-solid fa-chart-line';
      case 'fixed': return 'fa-solid fa-lock';
      default: return 'fa-solid fa-credit-card';
    }
  }
  

formatDate(date: Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
}
  
  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  }
  
  changeCurrency(currency: string): void {
    this.selectedCurrency = currency;
    this.calculateTotalBalance();
  }
  
  
  downloadAccountDetails(accountId: string): void {
    const account = this.accounts.find(a => a.id === accountId);
    if (!account) return;
    
    // Dates pour le relevé (dernier mois)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    this.accountService.downloadAccountStatement(
      accountId,
      startDate,
      endDate,
      'pdf'
    ).subscribe({
      next: (url) => {
        // Ouvrir le PDF dans un nouvel onglet (simulation)
        console.log(`Téléchargement du relevé pour le compte ${account.accountNumber}`);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du relevé', err);
      }
    });
  }
}