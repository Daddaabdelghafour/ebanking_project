import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Client, ClientFormData } from '../../shared/models/client.model';
import { Account } from '../../shared/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private mockClients: Client[] = [
    {
      id: 'cl1',
      firstName: 'Mohammed',
      lastName: 'El Amrani',
      email: 'mohammed.elamrani@gmail.com',
      phone: '+212 661234567',
      clientId: 'CLI001',
      address: '123 Avenue Hassan II',
      city: 'Casablanca',
      status: 'active',
      accountType: 'Premium',
      balance: 75650.45,
      currency: 'MAD',
      imageUrl: 'https://randomuser.me/api/portraits/men/11.jpg',
      dateJoined: new Date('2020-03-15'),
      lastLogin: new Date('2023-05-12T09:45:00'),
      identityNumber: 'BE789456',
      identityType: 'CIN',
      birthDate: new Date('1985-07-22'),
      occupation: 'Engineer',
      income: 25000,
      contactPreference: 'Email',
      accounts: [
        {
          id: 'acc1',
          clientId: 'cl1',
          accountNumber: '11223344556677',
          type: 'current',
          balance: 75650.45,
          availableBalance: 75000.00,
          currency: 'MAD',
          status: 'active',
          openedDate: new Date('2020-03-15'),
          lastTransactionDate: new Date('2023-05-10'),
          iban: 'MA64 1234 5678 9012 3456 7890 1234',
          dailyLimit: 10000,
          monthlyLimit: 50000,
          isPrimary: true,
          interestRate: 0,
          createdAt: new Date('2020-03-15'),
          updatedAt: new Date('2023-05-10')
        },
        {
          id: 'acc2',
          clientId: 'cl1',
          accountNumber: '77665544332211',
          type: 'savings',
          balance: 125000,
          availableBalance: 125000,
          currency: 'MAD',
          status: 'active',
          openedDate: new Date('2020-07-22'),
          lastTransactionDate: new Date('2023-04-15'),
          iban: 'MA64 1234 5678 9012 3456 7890 5678',
          dailyLimit: 5000,
          monthlyLimit: 20000,
          isPrimary: false,
          interestRate: 2.5,
          createdAt: new Date('2020-07-22'),
          updatedAt: new Date('2023-04-15')
        }
      ]
    },
    {
      id: 'cl2',
      firstName: 'Amal',
      lastName: 'Benkirane',
      email: 'amal.benk@outlook.com',
      phone: '+212 672345678',
      clientId: 'CLI002',
      address: '45 Rue des Orangers, Agdal',
      city: 'Rabat',
      status: 'active',
      accountType: 'Standard',
      balance: 23475.90,
      currency: 'MAD',
      imageUrl: 'https://randomuser.me/api/portraits/women/23.jpg',
      dateJoined: new Date('2021-06-10'),
      lastLogin: new Date('2023-05-10T16:20:00'),
      identityNumber: 'AB123789',
      identityType: 'CIN',
      birthDate: new Date('1990-12-05'),
      occupation: 'Professor',
      income: 18000,
      contactPreference: 'Phone',
      accounts: [
        {
          id: 'acc3',
          clientId: 'cl2',
          accountNumber: '12345678901234',
          type: 'current',
          balance: 23475.90,
          availableBalance: 23000,
          currency: 'MAD',
          status: 'active',
          openedDate: new Date('2021-06-10'),
          lastTransactionDate: new Date('2023-05-08'),
          iban: 'MA64 5678 1234 5678 9012 3456 7890',
          dailyLimit: 5000,
          monthlyLimit: 30000,
          isPrimary: true,
          interestRate: 0,
          createdAt: new Date('2021-06-10'),
          updatedAt: new Date('2023-05-08')
        }
      ]
    },
    {
      id: 'cl3',
      firstName: 'Karim',
      lastName: 'Tazi',
      email: 'k.tazi@gmail.com',
      phone: '+212 683456789',
      clientId: 'CLI003',
      address: '78 Boulevard Mohammed V',
      city: 'Marrakech',
      status: 'blocked',
      accountType: 'Standard',
      balance: 1250.00,
      currency: 'MAD',
      imageUrl: 'https://randomuser.me/api/portraits/men/33.jpg',
      dateJoined: new Date('2019-11-05'),
      lastLogin: new Date('2023-01-30T14:15:00'),
      identityNumber: 'CD452136',
      identityType: 'CIN',
      birthDate: new Date('1978-03-18'),
      occupation: 'Business Owner',
      income: 45000,
      contactPreference: 'Email',
      accounts: []
    },
    {
      id: 'cl4',
      firstName: 'Leila',
      lastName: 'Moutawakil',
      email: 'leila.moutawakil@hotmail.com',
      phone: '+212 694567890',
      clientId: 'CLI004',
      address: '15 Avenue Mohammed VI',
      city: 'Tangier',
      status: 'inactive',
      accountType: 'Premium',
      balance: 125750.80,
      currency: 'MAD',
      imageUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
      dateJoined: new Date('2020-07-25'),
      lastLogin: new Date('2022-11-15T10:30:00'),
      identityNumber: 'EF784512',
      identityType: 'CIN',
      birthDate: new Date('1982-09-30'),
      occupation: 'Doctor',
      income: 40000,
      contactPreference: 'Email',
      accounts: [
        {
          id: 'acc4',
          clientId: 'cl4',
          accountNumber: '98765432109876',
          type: 'current',
          balance: 125750.80,
          availableBalance: 125000,
          currency: 'MAD',
          status: 'inactive',
          openedDate: new Date('2020-07-25'),
          lastTransactionDate: new Date('2022-11-12'),
          iban: 'MA64 9876 5432 1098 7654 3210 9876',
          dailyLimit: 15000,
          monthlyLimit: 100000,
          isPrimary: true,
          interestRate: 0,
          createdAt: new Date('2020-07-25'),
          updatedAt: new Date('2022-11-12')
        }
      ]
    },
    {
      id: 'cl5',
      firstName: 'Nabil',
      lastName: 'El Fassi',
      email: 'nabil.elfassi@gmail.com',
      phone: '+212 705678901',
      clientId: 'CLI005',
      address: '32 Rue Ibn Battouta',
      city: 'Fes',
      status: 'pending',
      accountType: 'Standard',
      balance: 0,
      currency: 'MAD',
      imageUrl: undefined,
      dateJoined: new Date('2023-04-28'),
      lastLogin: undefined,
      identityNumber: 'GH458796',
      identityType: 'CIN',
      birthDate: new Date('1995-05-14'),
      occupation: 'Software Developer',
      income: 15000,
      contactPreference: 'Phone',
      accounts: []
    },
    {
      id: 'cl6',
      firstName: 'Fatima',
      lastName: 'Zahra',
      email: 'fatima.z@gmail.com',
      phone: '+212 716789012',
      clientId: 'CLI006',
      address: '54 Avenue des FAR',
      city: 'Casablanca',
      status: 'active',
      accountType: 'Gold',
      balance: 352400.25,
      currency: 'MAD',
      imageUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
      dateJoined: new Date('2018-09-12'),
      lastLogin: new Date('2023-05-11T11:45:00'),
      identityNumber: 'IJ895623',
      identityType: 'Passport',
      birthDate: new Date('1975-11-22'),
      occupation: 'Entrepreneur',
      income: 60000,
      contactPreference: 'Email',
      accounts: [
        {
          id: 'acc5',
          clientId: 'cl6',
          accountNumber: '65432109876543',
          type: 'current',
          balance: 352400.25,
          availableBalance: 350000,
          currency: 'MAD',
          status: 'active',
          openedDate: new Date('2018-09-12'),
          lastTransactionDate: new Date('2023-05-09'),
          iban: 'MA64 6543 2109 8765 4321 0987 6543',
          dailyLimit: 50000,
          monthlyLimit: 300000,
          isPrimary: true,
          interestRate: 0,
          createdAt: new Date('2018-09-12'),
          updatedAt: new Date('2023-05-09')
        }
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    // In a real app, this would call an API
    return of(this.mockClients).pipe(delay(800));
  }

  getClientById(id: string): Observable<Client | undefined> {
    // In a real app, this would call an API
    const client = this.mockClients.find(c => c.id === id);
    return of(client).pipe(delay(300));
  }

  getClientAccounts(clientId: string): Observable<Account[]> {
    // In a real app, this would call an API
    const client = this.mockClients.find(c => c.id === clientId);
    return of(client?.accounts || []).pipe(delay(400));
  }

  getAccountById(accountId: string): Observable<Account | undefined> {
    // In a real app, this would call an API
    for (const client of this.mockClients) {
      if (client.accounts) {
        const account = client.accounts.find(a => a.id === accountId);
        if (account) {
          return of(account).pipe(delay(300));
        }
      }
    }
    return of(undefined).pipe(delay(300));
  }

  createClient(clientData: ClientFormData): Observable<Client> {
    // In a real app, this would call an API
    const newClient: Client = {
      id: 'cl' + (this.mockClients.length + 1),
      clientId: 'CLI00' + (this.mockClients.length + 1),
      balance: 0,
      dateJoined: new Date(),
      lastLogin: undefined,
      birthDate: clientData.birthDate || new Date(), // Provide default
      accounts: [], // Initialize with empty array
      ...clientData
    };
    
    this.mockClients.push(newClient);
    return of(newClient).pipe(delay(500));
  }

  createAccount(clientId: string, accountData: Partial<Account>): Observable<Account> {
    // In a real app, this would call an API
    const clientIndex = this.mockClients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) {
      return of(undefined as any).pipe(delay(500));
    }

    const accountId = 'acc' + (
      this.mockClients
        .map(client => client.accounts?.length || 0)
        .reduce((acc, val) => acc + val, 0) + 1
    );

    const now = new Date();
    
    // Create new account with required fields and provided data
    const newAccount: Account = {
      id: accountId,
      clientId: clientId,
      accountNumber: Math.floor(Math.random() * 10000000000000000).toString(),
      type: accountData.type || 'current',
      balance: accountData.balance || 0,
      availableBalance: accountData.availableBalance || accountData.balance || 0,
      currency: accountData.currency || 'MAD',
      status: accountData.status || 'active',
      openedDate: accountData.openedDate || now,
      createdAt: now,
      ...accountData
    };
    
    // Initialize accounts array if it doesn't exist
    if (!this.mockClients[clientIndex].accounts) {
      this.mockClients[clientIndex].accounts = [];
    }
    this.mockClients[clientIndex].accounts.push(newAccount);
    
    // Update client balance
    this.updateClientBalance(clientId);
    
    return of(newAccount).pipe(delay(500));
  }

  updateAccount(accountId: string, updates: Partial<Account>): Observable<Account> {
    // Find the account and update it
    for (const client of this.mockClients) {
      if (!client.accounts) continue;
      const accountIndex = client.accounts.findIndex(a => a.id === accountId);
      if (accountIndex !== -1) {
        const updatedAccount = {
          ...client.accounts[accountIndex],
          ...updates,
          updatedAt: new Date()
        };
        
        client.accounts[accountIndex] = updatedAccount;
        
        // Update client balance if necessary
        if (updates.balance !== undefined) {
          this.updateClientBalance(client.id);
        }
        
        return of(updatedAccount).pipe(delay(500));
      }
    }
    
    return of(undefined as any).pipe(delay(500));
  }

  updateClient(id: string, clientData: ClientFormData): Observable<Client> {
    // Find the client by ID
    const index = this.mockClients.findIndex(c => c.id === id);
    if (index !== -1) {
      // Update client data, preserving accounts and other fields not in form
      const existingClient = this.mockClients[index];
      const updatedClient: Client = {
        ...existingClient,
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        status: clientData.status,
        accountType: clientData.accountType,
        currency: clientData.currency,
        identityNumber: clientData.identityNumber,
        identityType: clientData.identityType,
        birthDate: clientData.birthDate || existingClient.birthDate,
        occupation: clientData.occupation,
        income: clientData.income
      };
      
      this.mockClients[index] = updatedClient;
      return of(updatedClient).pipe(delay(500));
    }
    
    return of(undefined as any).pipe(delay(500));
  }

  deleteClient(id: string): Observable<boolean> {
    // In a real app, this would call an API to delete
    const initialLength = this.mockClients.length;
    this.mockClients = this.mockClients.filter(c => c.id !== id);
    return of(this.mockClients.length < initialLength).pipe(delay(500));
  }

  deleteAccount(accountId: string): Observable<boolean> {
    // In a real app, this would call an API to delete
    for (const client of this.mockClients) {
      if (!client.accounts) continue;
      
      const initialLength = client.accounts.length;
      client.accounts = client.accounts.filter(a => a.id !== accountId);
      
      if (client.accounts.length < initialLength) {
        // Update client balance
        this.updateClientBalance(client.id);
        return of(true).pipe(delay(500));
      }
    }
    
    return of(false).pipe(delay(500));
  }

  // Helper method to update a client's total balance based on their accounts
  private updateClientBalance(clientId: string): void {
    const client = this.mockClients.find(c => c.id === clientId);
    if (client && client.accounts) {
      client.balance = client.accounts.reduce((sum, account) => {
        if (account.status === 'active') {
          return sum + account.balance;
        }
        return sum;
      }, 0);
    }
  }

  // Utility methods for form dropdowns
  getCities(): Observable<string[]> {
    return of([
      'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 
      'Oujda', 'Meknes', 'Kenitra', 'Tetouan', 'El Jadida', 'Safi', 
      'Mohammedia', 'Essaouira', 'Nador'
    ]).pipe(delay(300));
  }

  getAccountTypes(): Observable<string[]> {
    return of([
      'Standard', 'Premium', 'Gold', 'Platinum', 'Student'
    ]).pipe(delay(300));
  }

  getCurrencies(): Observable<string[]> {
    return of([
      'MAD', 'EUR', 'USD', 'GBP'
    ]).pipe(delay(300));
  }

  getAccountCategories(): Observable<string[]> {
    return of([
      'current', 'savings', 'investment', 'fixed', 'other'
    ]).pipe(delay(300));
  }
}