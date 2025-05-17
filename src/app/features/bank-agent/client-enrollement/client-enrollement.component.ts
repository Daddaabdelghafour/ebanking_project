import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../services/client/client.service';
import { Client, ClientFormData } from '../../../shared/models/client.model';
import { CurrencyApiService } from '../../../services/currency/currency-api.service';
@Component({
  selector: 'app-client-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-enrollement.component.html',
  styleUrls: ['./client-enrollement.component.css']
})
export class ClientEnrollmentComponent implements OnInit {
  enrollmentForm: FormGroup;
  clients: Client[] = [];
  filteredClients: Client[] = [];
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  isEditing = false;
  currentClientId: string | null = null;
  
  // Options pour les listes déroulantes
  accountTypes: string[] = [];
  currencies: string[] = [];
  cities: string[] = [];
  identityTypes: { id: string, name: string }[] = [
    { id: 'CIN', name: 'Carte d\'Identité Nationale' },
    { id: 'Passport', name: 'Passeport' },
    { id: 'Residence Card', name: 'Carte de Séjour' }
  ];

  constructor(
    private fb: FormBuilder, 
    private clientService: ClientService,
    private currencyService: CurrencyApiService
  ) {
    this.enrollmentForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadAccountTypes();
    this.loadCurrencies();
    this.loadCities();
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+[0-9]{1,3}|0)[0-9]{9}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      status: ['pending', Validators.required],
      accountType: ['', Validators.required],
      currency: ['', Validators.required],
      identityNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{5,10}$/)]],
      identityType: ['CIN', Validators.required],
      birthDate: ['', Validators.required],
      occupation: [''],
      income: [null, [Validators.min(0)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  loadClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = [...clients];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients', error);
        this.errorMessage = 'Erreur lors du chargement des clients. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  loadAccountTypes(): void {
    this.clientService.getAccountTypes().subscribe({
      next: (accountTypes) => {
        this.accountTypes = accountTypes;
      },
      error: (error) => {
        console.error('Error loading account types', error);
      }
    });
  }

  loadCities(): void {
    this.clientService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
      },
      error: (error) => {
        console.error('Error loading cities', error);
      }
    });
  }

  loadCurrencies(): void {
    this.clientService.getCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
      },
      error: (error) => {
        console.error('Error loading currencies', error);
      }
    });
  }

  submitForm(): void {
    if (this.enrollmentForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les messages d'erreur
      Object.keys(this.enrollmentForm.controls).forEach(key => {
        this.enrollmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Préparer les données
    const formData: ClientFormData = {
      ...this.enrollmentForm.value
    };

    // Ajouter/mettre à jour le client
    if (this.isEditing && this.currentClientId) {
      this.clientService.updateClient(this.currentClientId, formData).subscribe({
        next: (client) => {
          this.successMessage = 'Client mis à jour avec succès';
          this.isSubmitting = false;
          this.resetForm();
          this.loadClients();
        },
        error: (error) => {
          console.error('Error updating client', error);
          this.errorMessage = 'Erreur lors de la mise à jour du client';
          this.isSubmitting = false;
        }
      });
    } else {
      this.clientService.createClient(formData).subscribe({
        next: (client) => {
          this.successMessage = 'Client enregistré avec succès';
          this.isSubmitting = false;
          this.resetForm();
          this.loadClients();
        },
        error: (error) => {
          console.error('Error creating client', error);
          this.errorMessage = 'Erreur lors de l\'enregistrement du client';
          this.isSubmitting = false;
        }
      });
    }
  }

  resetForm(): void {
    this.enrollmentForm.reset();
    this.isEditing = false;
    this.currentClientId = null;
    // Définir les valeurs par défaut
    this.enrollmentForm.patchValue({
      status: 'pending',
      identityType: 'CIN'
    });
  }

  searchClients(query: string): void {
    query = query.toLowerCase().trim();
    if (!query) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.filteredClients = this.clients.filter(client => 
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query) ||
      client.identityNumber.toLowerCase().includes(query)
    );
  }

  editClient(client: Client): void {
    this.isEditing = true;
    this.currentClientId = client.id;
    
    // Formatage de la date pour l'élément input date
    const birthDate = this.formatDateForInput(client.birthDate);

    this.enrollmentForm.patchValue({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      status: client.status,
      accountType: client.accountType,
      currency: client.currency,
      identityNumber: client.identityNumber,
      identityType: client.identityType,
      birthDate: birthDate,
      occupation: client.occupation,
      income: client.income
    });
    
    // Les champs de mot de passe ne sont pas remplis lors de l'édition
    this.enrollmentForm.get('password')?.clearValidators();
    this.enrollmentForm.get('confirmPassword')?.clearValidators();
    this.enrollmentForm.get('password')?.updateValueAndValidity();
    this.enrollmentForm.get('confirmPassword')?.updateValueAndValidity();
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteClient(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      this.clientService.deleteClient(id).subscribe({
        next: (success) => {
          if (success) {
            this.successMessage = 'Client supprimé avec succès';
            this.loadClients();
          } else {
            this.errorMessage = 'Erreur lors de la suppression du client';
          }
        },
        error: (error) => {
          console.error('Error deleting client', error);
          this.errorMessage = 'Erreur lors de la suppression du client';
        }
      });
    }
  }

  toggleClientStatus(client: Client): void {
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    
    this.clientService.updateClient(client.id, {
      ...client,
      status: newStatus
    } as ClientFormData).subscribe({
      next: () => {
        this.loadClients();
      },
      error: (error) => {
        console.error('Error updating client status', error);
        this.errorMessage = 'Erreur lors de la modification du statut';
      }
    });
  }

  showValidationError(controlName: string): boolean {
    const control = this.enrollmentForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getFullName(client: Client): string {
    return `${client.firstName} ${client.lastName}`;
  }

  getIdentityTypeName(type: string): string {
    const identityType = this.identityTypes.find(t => t.id === type);
    return identityType ? identityType.name : type;
  }
}