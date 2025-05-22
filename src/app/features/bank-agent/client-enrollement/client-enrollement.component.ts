import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../services/client/client.service';
import { Client, ClientFormData } from '../../../shared/models/client.model';
import { CurrencyApiService } from '../../../services/currency/currency-api.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

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
  
  // États de chargement et d'erreurs
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  // État d'édition
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
    this.loadInitialData();
  }

  /**
   * Charge toutes les données initiales nécessaires
   */
  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Charger simultanément les clients et les options de formulaire
    forkJoin({
      clients: this.clientService.getClients().pipe(
        catchError(error => {
          console.error('Error loading clients', error);
          return of([]);
        })
      ),
      accountTypes: this.clientService.getAccountTypes().pipe(
        catchError(() => of([]))
      ),
      currencies: this.clientService.getCurrencies().pipe(
        catchError(() => of([]))
      ),
      cities: this.clientService.getCities().pipe(
        catchError(() => of([]))
      )
    }).pipe(
      tap(results => {
        this.clients = results.clients;
        this.filteredClients = [...results.clients];
        this.accountTypes = results.accountTypes;
        this.currencies = results.currencies;
        this.cities = results.cities;
        
        // Définir les valeurs par défaut après chargement
        if (results.currencies.length > 0) {
          this.enrollmentForm.patchValue({ currency: results.currencies[0] });
        }
        if (results.accountTypes.length > 0) {
          this.enrollmentForm.patchValue({ accountType: results.accountTypes[0] });
        }
      }),
      catchError(error => {
        console.error('Error loading initial data', error);
        this.errorMessage = 'Erreur lors du chargement des données. Veuillez réessayer.';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  /**
   * Crée le formulaire d'inscription client avec validations
   */
  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+[0-9]{1,3}|0)[0-9]{9}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['Maroc', Validators.required],
      status: ['active', Validators.required],
      accountType: ['', Validators.required],
      currency: ['', Validators.required],
      identityNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,10}$/)]],
      identityType: ['CIN', Validators.required],
      birthDate: ['', Validators.required],
      occupation: [''],
      income: [null, [Validators.min(0)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      language: ['fr', Validators.required],
      gdprConsent: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  /**
   * Charge la liste des clients
   */
  loadClients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.clientService.getClients().pipe(
      tap(clients => {
        this.clients = clients;
        this.filteredClients = [...clients];
      }),
      catchError(error => {
        console.error('Error loading clients', error);
        this.errorMessage = 'Erreur lors du chargement des clients. Veuillez réessayer.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  /**
   * Charge les types de comptes disponibles
   */
  loadAccountTypes(): void {
    this.clientService.getAccountTypes().pipe(
      tap(accountTypes => {
        this.accountTypes = accountTypes;
      }),
      catchError(error => {
        console.error('Error loading account types', error);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Charge les villes disponibles
   */
  loadCities(): void {
    this.clientService.getCities().pipe(
      tap(cities => {
        this.cities = cities;
      }),
      catchError(error => {
        console.error('Error loading cities', error);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Charge les devises disponibles
   */
  loadCurrencies(): void {
    this.clientService.getCurrencies().pipe(
      tap(currencies => {
        this.currencies = currencies;
      }),
      catchError(error => {
        console.error('Error loading currencies', error);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Soumet le formulaire d'inscription/mise à jour
   */
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

    // Extraire les données du formulaire
    const formValues = this.enrollmentForm.value;
    
    // Créer un objet ClientFormData correctement formaté pour l'API utilisateur
    const clientFormData: ClientFormData = {
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

    // Ajouter/mettre à jour le client selon le mode
    const operation = this.isEditing && this.currentClientId
      ? this.clientService.updateClient(this.currentClientId, clientFormData)
      : this.clientService.createClient(clientFormData); // Suppression du paramètre "new"
    
    operation.pipe(
      tap(client => {
        this.successMessage = this.isEditing 
          ? 'Client mis à jour avec succès' 
          : 'Client enregistré avec succès';
        this.resetForm();
        this.loadClients();
      }),
      catchError(error => {
        console.error(`Error ${this.isEditing ? 'updating' : 'creating'} client`, error);
        this.errorMessage = this.isEditing
          ? 'Erreur lors de la mise à jour du client'
          : 'Erreur lors de l\'enregistrement du client';
        return of(null);
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe();
  }

  /**
   * Réinitialise le formulaire et l'état d'édition
   */
  resetForm(): void {
    this.enrollmentForm.reset({
      status: 'active',
      identityType: 'CIN',
      country: 'Maroc',
      language: 'fr',
      gdprConsent: false
    });
    
    this.isEditing = false;
    this.currentClientId = null;
    
    // Ajouter les valeurs des dropdowns après reset
    if (this.accountTypes.length > 0) {
      this.enrollmentForm.patchValue({ accountType: this.accountTypes[0] });
    }
    if (this.currencies.length > 0) {
      this.enrollmentForm.patchValue({ currency: this.currencies[0] });
    }
    if (this.cities.length > 0) {
      this.enrollmentForm.patchValue({ city: this.cities[0] });
    }

    // Rétablir les validations des champs de mot de passe
    this.enrollmentForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.enrollmentForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.enrollmentForm.get('password')?.updateValueAndValidity();
    this.enrollmentForm.get('confirmPassword')?.updateValueAndValidity();
  }

  /**
   * Filtre les clients selon le terme de recherche
   */
  searchClients(query: string): void {
    query = query.toLowerCase().trim();
    if (!query) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.filteredClients = this.clients.filter(client => 
      (client.firstName?.toLowerCase() || '').includes(query) ||
      (client.lastName?.toLowerCase() || '').includes(query) ||
      (client.email?.toLowerCase() || '').includes(query) ||
      (client.phone?.toLowerCase() || '').includes(query) ||
      (client.identityNumber?.toLowerCase() || '').includes(query)
    );
  }

  /**
   * Prépare le formulaire pour l'édition d'un client existant
   */
  editClient(client: Client): void {
    this.isEditing = true;
    this.currentClientId = client.id;
    
    // Formatage de la date pour l'élément input date
    const birthDate = this.formatDateForInput(client.birthDate);

    this.enrollmentForm.patchValue({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || 'Maroc',
      status: client.status || 'active',
      accountType: client.accountType || '',
      currency: client.currency || '',
      identityNumber: client.identityNumber || '',
      identityType: client.identityType || 'CIN',
      birthDate: birthDate,
      occupation: client.occupation || '',
      income: client.income || null,
      language: client.language || 'fr'
    });
    
    // Désactiver les validations des champs de mot de passe lors de l'édition
    this.enrollmentForm.get('password')?.clearValidators();
    this.enrollmentForm.get('confirmPassword')?.clearValidators();
    this.enrollmentForm.get('password')?.updateValueAndValidity();
    this.enrollmentForm.get('confirmPassword')?.updateValueAndValidity();
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Annule le mode édition
   */
  cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Supprime un client après confirmation
   */
  deleteClient(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.clientService.deleteClient(id).pipe(
        tap(success => {
          if (success) {
            this.successMessage = 'Client supprimé avec succès';
            this.loadClients();
          } else {
            this.errorMessage = 'Erreur lors de la suppression du client';
          }
        }),
        catchError(error => {
          console.error('Error deleting client', error);
          this.errorMessage = 'Erreur lors de la suppression du client';
          return of(false);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe();
    }
  }

  /**
   * Bascule l'état actif/inactif d'un client
   */
  toggleClientStatus(client: Client): void {
    if (!client || !client.id) return;
    
    const newStatus = client.status === 'active' ? 'inactive' : 'active';
    this.isLoading = true;
    
    // Utiliser la méthode dédiée pour mettre à jour le statut
    this.clientService.updateClientStatus(client.id, newStatus).pipe(
      tap(success => {
        if (success) {
          this.successMessage = 'Statut du client mis à jour avec succès';
          this.loadClients();
        } else {
          this.errorMessage = 'Erreur lors de la modification du statut';
        }
      }),
      catchError(error => {
        console.error('Error updating client status', error);
        this.errorMessage = 'Erreur lors de la modification du statut';
        return of(false);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  /**
   * Vérification si un champ de formulaire doit afficher une erreur de validation
   */
  showValidationError(controlName: string): boolean {
    const control = this.enrollmentForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  /**
   * Retourne la classe CSS correspondant au statut du client
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Formate une date pour l'utilisation dans un input type="date"
   */
  formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const month = `${d.getMonth() + 1}`.padStart(2, '0');
      const day = `${d.getDate()}`.padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    } catch (e) {
      console.error('Error formatting date', e);
      return '';
    }
  }

  /**
   * Formate une date en format français
   */
  formatDate(date: Date | string): string {
    if (!date) return '-';
    
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch (e) {
      console.error('Error formatting date', e);
      return '-';
    }
  }

  /**
   * Renvoie le nom complet d'un client
   */
  getFullName(client: Client): string {
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A';
  }

  /**
   * Récupère le nom complet d'un type d'identité
   */
  getIdentityTypeName(type: string | undefined): string {
    if (!type) return 'Non spécifié';
    const identityType = this.identityTypes.find(t => t.id === type);
    return identityType ? identityType.name : type;
  }
  
  /**
   * Ferme les messages d'alerte
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}