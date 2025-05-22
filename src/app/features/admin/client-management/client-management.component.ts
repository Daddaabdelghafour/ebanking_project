import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, of, forkJoin } from 'rxjs';
import { Client, ClientFormData } from '../../../shared/models/client.model';

@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent implements OnInit {
  // API base URL - Correction de l'URL
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  
  // Client data
  clients: Client[] = [];
  cities: string[] = [
    'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 
    'Meknès', 'Oujda', 'Kenitra', 'Tétouan', 'Salé', 'Nador', 'Mohammedia'
  ];
  accountTypes: string[] = [
    'Compte Standard', 'Compte Épargne', 'Compte Premium', 'Compte Étudiant', 'Compte Professionnel'
  ];
  currencies: string[] = ['MAD', 'EUR', 'USD', 'GBP'];
  Math = Math;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  showModal = false;
  isEditing = false;
  isDeleting = false;
  isViewingDetails = false;
  selectedClient: Client | null = null;
  debugMode = false;
  
  // Form
  clientForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  
  // Filter & Sort
  filterText = '';
  sortBy = 'dateJoined';
  sortOrder: 'asc' | 'desc' = 'desc';
  statusFilter: 'all' | 'active' | 'inactive' | 'blocked' | 'pending' = 'all';
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.clientForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['Maroc', [Validators.required]],
      accountType: ['Compte Standard', [Validators.required]],
      status: ['active', [Validators.required]],
      currency: ['MAD', [Validators.required]],
      identityNumber: ['', [Validators.required]],
      identityType: ['CIN', [Validators.required]],
      birthDate: ['', [Validators.required]],
      occupation: [''],
      income: [null],
      language: ['fr', [Validators.required]],
      gdprConsent: [false],
      password: ['', [
        Validators.minLength(8),
        (control: AbstractControl) => !this.isEditing && !control.value ? { required: true } : null
      ]],
      confirmPassword: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadClients();
  }

  /**
   * Charge les clients depuis l'API
   */
  loadClients(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any[]>(`${this.apiUrl}/clients`)
      .pipe(
        switchMap(clients => {
          if (!clients || clients.length === 0) {
            return of([]);
          }

          console.log('Clients from API:', clients);

          // Pour chaque client, récupérer l'utilisateur associé
          const enrichedClientRequests = clients.map(client => {
            const userId = client.userId;
            
            if (!userId) {
              console.warn(`Client ${client.id} has no userId`);
              return of(this.mapClientData(client, {}));
            }
            
            // Requête pour obtenir les détails de l'utilisateur
            return this.http.get<any>(`${this.apiUrl}/users/${userId}`).pipe(
              map(userData => {
                console.log(`User data for client ${client.id}:`, userData);
                return this.mapClientData(client, userData);
              }),
              catchError(error => {
                console.error(`Error fetching user ${userId} for client ${client.id}:`, error);
                return of(this.mapClientData(client, {}));
              })
            );
          });

          return enrichedClientRequests.length > 0 ? forkJoin(enrichedClientRequests) : of([]);
        }),
        catchError(error => {
          console.error('Error fetching clients:', error);
          this.error = 'Impossible de charger les clients. Veuillez réessayer.';
          return of([]);
        })
      )
      .subscribe({
        next: (enrichedClients) => {
          this.clients = enrichedClients;
          this.isLoading = false;
          console.log('Final enriched clients:', this.clients);
        },
        error: (err) => {
          this.error = 'Impossible de charger les clients. Veuillez réessayer.';
          this.isLoading = false;
          console.error('Error loading clients:', err);
        }
      });
  }

  /**
   * Mappe les données client et utilisateur
   */
  private mapClientData(client: any, userData: any): Client {
    return {
      id: client.id,
      userId: userData.id || client.userId,
      firstName: userData.firstName || client.firstName || '',
      lastName: userData.lastName || client.lastName || '',
      email: userData.email || client.email || '',
      phone: userData.phoneNumber || client.phone || '',
      phoneNumber: userData.phoneNumber || client.phoneNumber || '',
      clientId: client.clientId || client.id || '',
      identityNumber: userData.identityNumber || client.identityNumber || '',
      identityType: userData.identityType || client.identityType || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || 'Maroc',
      status: client.status || (userData.isActive ? 'active' : 'inactive'),
      isActive: userData.isActive,
      accountType: client.accountType || 'Compte Standard',
      dateJoined: client.createdAt || userData.createdAt,
      createdAt: client.createdAt || userData.createdAt,
      updatedAt: client.updatedAt || userData.updatedAt,
      language: userData.language || client.language || 'fr',
      role: userData.role || client.role || 'CLIENT',
      gdprConsent: userData.gdprConsent !== undefined ? userData.gdprConsent : client.gdprConsent || false,
      gdprConsentDate: userData.gdprConsentDate || null,
      twoFactorEnabled: userData.twoFactorEnabled !== undefined ? userData.twoFactorEnabled : false,
      twoFactorMethod: userData.twoFactorMethod || '',
      lastLogin: userData.lastLogin || client.lastLogin,
      balance: client.balance || 0,
      currency: client.currency || 'MAD',
      birthDate: userData.birthDate || client.birthDate,
      occupation: client.occupation || ''
    };
  }

  /**
   * Affiche les détails complets d'un client
   */
  viewClientDetails(client: Client): void {
    this.isLoading = true;
    console.log('View details for client:', client);
    
    const userId = client.userId;
    
    if (!userId) {
      this.selectedClient = client;
      this.isViewingDetails = true;
      this.isLoading = false;
      return;
    }
    
    // Récupérer les informations complètes de l'utilisateur
    this.http.get<any>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        map(userData => {
          console.log(`Complete user data for client ${client.id}:`, userData);
          return this.mapClientData(client, userData);
        }),
        catchError(error => {
          console.error(`Error fetching user ${userId} for client details:`, error);
          return of(client);
        })
      )
      .subscribe(enrichedClient => {
        this.selectedClient = enrichedClient;
        this.isViewingDetails = true;
        this.isLoading = false;
      });
  }
  
  openAddModal(): void {
    this.isEditing = false;
    this.selectedClient = null;
    this.error = null; // Réinitialiser les erreurs
    this.clientForm.reset({
      status: 'active',
      accountType: 'Compte Standard',
      currency: 'MAD',
      identityType: 'CIN',
      country: 'Maroc',
      language: 'fr',
      gdprConsent: false
    });
    this.showModal = true;
  }

  openEditModal(client: Client): void {
    this.isEditing = true;
    this.selectedClient = client;
    this.error = null; // Réinitialiser les erreurs
    
    // Pré-remplir le formulaire avec les données du client
    this.clientForm.patchValue({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || 'Maroc',
      accountType: client.accountType || 'Compte Standard',
      status: client.status || 'active',
      currency: client.currency || 'MAD',
      identityNumber: client.identityNumber || '',
      identityType: client.identityType || 'CIN',
      birthDate: client.birthDate || '',
      occupation: client.occupation || '',
      income: client.income || null,
      language: client.language || 'fr',
      gdprConsent: client.gdprConsent || false
    });
    
    // Supprimer les validateurs de mot de passe lors de la modification
    const passwordControl = this.clientForm.get('password');
    const confirmPasswordControl = this.clientForm.get('confirmPassword');
    
    if (passwordControl && confirmPasswordControl) {
      passwordControl.clearValidators();
      passwordControl.updateValueAndValidity();
      confirmPasswordControl.clearValidators();
      confirmPasswordControl.updateValueAndValidity();
    }
    
    this.showModal = true;
  }

  closeDetailsView(): void {
    this.isViewingDetails = false;
    this.selectedClient = null;
  }

  confirmDeleteClient(client: Client): void {
    this.selectedClient = client;
    this.isDeleting = true;
  }

  cancelDelete(): void {
    this.isDeleting = false;
    this.selectedClient = null;
  }

  deleteClient(): void {
    if (!this.selectedClient) return;
    
    this.isLoading = true;
    
    this.http.delete<void>(`${this.apiUrl}/clients/${this.selectedClient.id}`)
      .subscribe({
        next: () => {
          this.loadClients();
          this.cancelDelete();
        },
        error: (err) => {
          this.error = "Impossible de supprimer le client. Veuillez réessayer.";
          this.isLoading = false;
          console.error('Error deleting client:', err);
        }
      });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedClient = null;
    this.isEditing = false;
    this.error = null; // Réinitialiser les erreurs
    this.clientForm.reset({
      status: 'active',
      accountType: 'Compte Standard',
      currency: 'MAD',
      identityType: 'CIN',
      country: 'Maroc',
      language: 'fr',
      gdprConsent: false
    });
  }

  // Méthode pour fermer les messages d'erreur
  clearError(): void {
    this.error = null;
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    const formValues = this.clientForm.value;
    this.isLoading = true;
    this.error = null; // Réinitialiser les erreurs avant l'opération
    
    if (this.isEditing && this.selectedClient) {
      // Mise à jour d'un client existant
      this.updateExistingClient(formValues);
    } else {
      // Création d'un nouveau client
      this.createNewClient(formValues);
    }
  }

  // Remplacez la méthode createNewClient par cette version simplifiée :
private createNewClient(formValues: any): void {
  // Étape 1: Créer l'utilisateur
  const userDto = {
    email: formValues.email,
    firstName: formValues.firstName,
    lastName: formValues.lastName,
    phoneNumber: formValues.phone,
    role: 'CLIENT',
    isActive: formValues.status === 'active',
    language: formValues.language,
    gdprConsent: formValues.gdprConsent,
    gdprConsentDate: formValues.gdprConsent ? new Date().toISOString() : null,
    identityType: formValues.identityType,
    identityNumber: formValues.identityNumber,
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
    passwordHash: formValues.password
  };
  
  this.http.post<any>(`${this.apiUrl}/users`, userDto)
    .pipe(
      switchMap(user => {
        console.log('Created user:', user);
        // Étape 2: Créer le client avec l'ID utilisateur
        return this.http.post<any>(`${this.apiUrl}/clients/${user.id}`, {}).pipe(
          map(client => ({ user, client })) // Retourner les deux objets
        );
      }),
      switchMap(({ user, client }) => {
        console.log('Created client:', client);
        // Étape 3: Mettre à jour le client avec les informations supplémentaires
        const clientUpdateDto = {
          address: formValues.address,
          city: formValues.city,
          postalCode: formValues.postalCode,
          country: formValues.country,
          accountType: formValues.accountType,
          occupation: formValues.occupation,
          income: formValues.income,
          currency: formValues.currency,
          status: formValues.status
        };
        return this.http.put<any>(`${this.apiUrl}/clients/${client.id}`, clientUpdateDto);
      })
    )
    .subscribe({
      next: (result) => {
        console.log('Client creation completed successfully:', result);
        // Simplement recharger la page complète
        window.location.reload();
      },
      error: (err) => {
        console.error('Error in client creation process:', err);
        this.error = "Une erreur s'est produite lors de la création du client.";
        this.isLoading = false;
      }
    });
}

  private updateExistingClient(formValues: any): void {
    if (!this.selectedClient) return;

    const userId = this.selectedClient.userId;

    // Mise à jour des données utilisateur
    const userDto = {
      id: userId, // Ajouter l'ID pour la mise à jour
      email: formValues.email,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      phoneNumber: formValues.phone,
      isActive: formValues.status === 'active',
      language: formValues.language,
      gdprConsent: formValues.gdprConsent,
      identityType: formValues.identityType,
      identityNumber: formValues.identityNumber
    };
    
    this.http.put<any>(`${this.apiUrl}/users/${userId}`, userDto)
      .pipe(
        switchMap(() => {
          // Mise à jour des données client
          const clientDto = {
            address: formValues.address,
            city: formValues.city,
            postalCode: formValues.postalCode,
            country: formValues.country,
            accountType: formValues.accountType,
            occupation: formValues.occupation,
            income: formValues.income,
            currency: formValues.currency,
            status: formValues.status
          };
          return this.http.put<any>(`${this.apiUrl}/clients/${this.selectedClient!.id}`, clientDto);
        }),
        catchError(error => {
          console.error('Error updating client:', error);
          this.error = "Impossible de mettre à jour le client. Veuillez réessayer.";
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            console.log('Client update completed successfully');
            this.closeModal();
            this.isLoading = false;
            // Recharger avec un petit délai
            setTimeout(() => {
              this.loadClients();
            }, 500);
          }
        },
        error: (err) => {
          console.error('Error updating client:', err);
          this.error = "Une erreur s'est produite lors de la mise à jour du client.";
          this.isLoading = false;
        }
      });
  }

  updateClientStatus(client: Client, newStatus: string): void {
    this.isLoading = true;
    
    const params = new HttpParams().set('status', newStatus);
    
    this.http.put<any>(`${this.apiUrl}/clients/${client.id}/status`, null, { params })
      .subscribe({
        next: () => {
          // Mise à jour locale du statut
          client.status = newStatus;
          if (newStatus === 'active') {
            client.isActive = true;
          } else if (newStatus === 'inactive' || newStatus === 'blocked') {
            client.isActive = false;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.error = "Impossible de mettre à jour le statut du client.";
          this.isLoading = false;
          console.error('Error updating client status:', err);
        }
      });
  }

  verifyClient(client: Client): void {
    this.isLoading = true;
    
    this.http.put<any>(`${this.apiUrl}/clients/${client.id}/verify`, {})
      .subscribe({
        next: () => {
          this.loadClients(); // Recharger pour obtenir les données mises à jour
          this.isLoading = false;
        },
        error: (err) => {
          this.error = "Impossible de vérifier le client.";
          this.isLoading = false;
          console.error('Error verifying client:', err);
        }
      });
  }

  // Méthodes utilitaires (inchangées)
  passwordMatchValidator(group: FormGroup): null | { passwordMismatch: true } {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'blocked': return 'Bloqué';
      case 'pending': return 'En attente';
      default: return status;
    }
  }

  getFullName(client: Client | null): string {
    if (!client) return 'N/A';
    
    const firstName = client.firstName || '';
    const lastName = client.lastName || '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'N/A';
  }

  formatCurrency(amount: number | undefined, currency: string = 'MAD'): string {
    if (amount === undefined || amount === null) return '-';
    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: currency || 'MAD'
      }).format(amount);
    } catch (e) {
      console.error('Error formatting currency', e);
      return amount.toString();
    }
  }

  showValidationError(controlName: string): boolean {
    const control = this.clientForm.get(controlName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  getPasswordMismatchError(): boolean {
    return this.clientForm.hasError('passwordMismatch') && 
           !!this.clientForm.get('password')?.dirty &&
           !!this.clientForm.get('confirmPassword')?.dirty;
  }
  
  sortClients(property: string): void {
    if (this.sortBy === property) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = property;
      this.sortOrder = 'asc';
    }
  }
  
  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'fa-sort';
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  
  filterByStatus(status: 'all' | 'active' | 'inactive' | 'blocked' | 'pending'): void {
    this.statusFilter = status;
    this.currentPage = 1;
  }
  
  getFilteredClients(): Client[] {
    let filtered = [...this.clients];
    
    if (this.filterText) {
      const searchTerm = this.filterText.toLowerCase();
      filtered = filtered.filter(client => 
        (client.firstName?.toLowerCase() || '').includes(searchTerm) ||
        (client.lastName?.toLowerCase() || '').includes(searchTerm) ||
        (client.email?.toLowerCase() || '').includes(searchTerm) ||
        (client.clientId?.toLowerCase() || '').includes(searchTerm) ||
        (client.phone?.toLowerCase() || '').includes(searchTerm) ||
        (client.city?.toLowerCase() || '').includes(searchTerm)
      );
    }
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === this.statusFilter);
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = `${a.lastName || ''} ${a.firstName || ''}`.localeCompare(`${b.lastName || ''} ${b.firstName || ''}`);
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'accountType':
          comparison = (a.accountType || '').localeCompare(b.accountType || '');
          break;
        case 'balance':
          const aBalance = a.balance ?? 0;
          const bBalance = b.balance ?? 0;
          comparison = aBalance - bBalance;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'dateJoined':
          const dateA = a.dateJoined ? new Date(a.dateJoined).getTime() : 0;
          const dateB = b.dateJoined ? new Date(b.dateJoined).getTime() : 0;
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }
  
  getPaginatedClients(): Client[] {
    const filtered = this.getFilteredClients();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.getFilteredClients().length / this.itemsPerPage);
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}