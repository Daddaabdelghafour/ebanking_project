import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ClientService } from '../../../services/client/client.service';
import { Client, ClientFormData } from '../../../shared/models/client.model';

@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css'],
  providers: [ClientService]
})
export class ClientManagementComponent implements OnInit {
  // Client data
  clients: Client[] = [];
  cities: string[] = [];
  accountTypes: string[] = [];
  currencies: string[] = [];
  Math = Math;
  
  // UI state
  isLoading = true;
  error: string | null = null;
  showModal = false;
  isEditing = false;
  isDeleting = false;
  isViewingDetails = false;
  selectedClient: Client | null = null;
  
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
    private clientService: ClientService
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
      accountType: ['Standard', [Validators.required]],
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
        // Only required when creating a new client
        (control: AbstractControl) => !this.isEditing && !control.value ? { required: true } : null
      ]],
      confirmPassword: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadCities();
    this.loadAccountTypes();
    this.loadCurrencies();
  }

  loadClients(): void {
    this.isLoading = true;
    this.error = null;
    
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger les clients. Veuillez réessayer.';
        this.isLoading = false;
        console.error('Error loading clients:', err);
      }
    });
  }

  loadCities(): void {
    this.clientService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
      },
      error: (err) => {
        console.error('Error loading cities:', err);
      }
    });
  }

  loadAccountTypes(): void {
    this.clientService.getAccountTypes().subscribe({
      next: (types) => {
        this.accountTypes = types;
      },
      error: (err) => {
        console.error('Error loading account types:', err);
      }
    });
  }

  loadCurrencies(): void {
    this.clientService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
      },
      error: (err) => {
        console.error('Error loading currencies:', err);
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedClient = null;
    this.clientForm.reset({
      status: 'active',
      accountType: 'Standard',
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
    
    this.clientForm.patchValue({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode || '',
      country: client.country || 'Maroc',
      accountType: client.accountType,
      status: client.status,
      currency: client.currency,
      identityNumber: client.identityNumber,
      identityType: client.identityType,
      birthDate: client.birthDate ? new Date(client.birthDate) : null,
      occupation: client.occupation || '',
      income: client.income || null,
      language: client.language || 'fr',
      gdprConsent: !!client.gdprConsent
    });
    
    // Remove validators for password fields when editing
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

  viewClientDetails(client: Client): void {
    this.selectedClient = client;
    this.isViewingDetails = true;
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
    
    this.clientService.deleteClient(this.selectedClient.id).subscribe({
      next: (success) => {
        if (success) {
          this.loadClients();
          this.cancelDelete();
        } else {
          this.error = "Impossible de supprimer le client. Veuillez réessayer.";
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = "Une erreur s'est produite lors de la suppression du client.";
        this.isLoading = false;
        console.error('Error deleting client:', err);
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.clientForm.reset();
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    const formValues = this.clientForm.value;
    
    // Créer un objet ClientFormData correctement formaté pour l'API utilisateur
    const clientData: ClientFormData = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
      city: formValues.city,
      postalCode: formValues.postalCode,
      country: formValues.country,
      identityNumber: formValues.identityNumber,
      identityType: formValues.identityType,
      accountType: formValues.accountType,
      birthDate: formValues.birthDate,
      occupation: formValues.occupation,
      income: formValues.income,
      currency: formValues.currency,
      status: formValues.status,
      
      // Champs nécessaires pour l'API utilisateur
      password: formValues.password,
      language: formValues.language || 'fr',
      gdprConsent: formValues.gdprConsent || false
    };
    
    this.isLoading = true;
    
    if (this.isEditing && this.selectedClient) {
      this.clientService.updateClient(this.selectedClient.id, clientData).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = "Impossible de mettre à jour le client. Veuillez réessayer.";
          this.isLoading = false;
          console.error('Error updating client:', err);
        }
      });
    } else {
      this.clientService.createClient(clientData).subscribe({
        next: () => {
          this.loadClients();
          this.closeModal();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = "Impossible de créer le client. Veuillez réessayer.";
          this.isLoading = false;
          console.error('Error creating client:', err);
        }
      });
    }
  }

  // Helper methods
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

  getFullName(client: Client): string {
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A';
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number | undefined, currency: string = 'MAD'): string {
    if (amount === undefined || amount === null) return '-';
    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: currency || 'MAD' // Ajouter une valeur par défaut si currency est undefined
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
    
    // Apply text filter
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
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === this.statusFilter);
    }
    
    // Apply sorting
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