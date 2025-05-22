import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ClientService } from '../../../services/client/client.service';
import { Client } from '../../../shared/models/client.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  client: Client | null = null;
  isLoading = true;
  isSaving = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';
  activeTab = 'profile';
  
  personalInfoForm!: FormGroup;
  securityForm!: FormGroup;
  preferencesForm!: FormGroup;
  
  // Client ID utilisé dans toute l'application
  private clientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';

  contactPreferences = [
    { value: 'EMAIL', label: 'Email', icon: 'fa-envelope' },
    { value: 'PHONE', label: 'Téléphone', icon: 'fa-phone' },
    { value: 'SMS', label: 'SMS', icon: 'fa-mobile-alt' },
    { value: 'MAIL', label: 'Courrier postal', icon: 'fa-mail-bulk' }
  ];

  identityTypes = [
    { value: 'CIN', label: 'Carte d\'identité nationale' },
    { value: 'PASSPORT', label: 'Passeport' },
    { value: 'DRIVING_LICENSE', label: 'Permis de conduire' }
  ];

  accountTypes = [
    { value: 'CURRENT', label: 'Compte courant' },
    { value: 'SAVINGS', label: 'Compte épargne' },
    { value: 'BUSINESS', label: 'Compte professionnel' }
  ];

  currencies = [
    { value: 'MAD', label: 'Dirham marocain (MAD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar américain (USD)' }
  ];

  constructor(
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadClientData();
  }

  /**
   * Initialiser les formulaires
   */
  initializeForms(): void {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+212|0)[5-7]\d{8}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      occupation: [''],
      birthDate: ['', Validators.required]
    });

    this.securityForm = this.fb.group({
      identityType: ['', Validators.required],
      identityNumber: ['', Validators.required],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(8)]],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });

    this.preferencesForm = this.fb.group({
      contactPreference: ['EMAIL'],
      accountType: [''],
      currency: ['MAD'],
      emailNotifications: [true],
      smsNotifications: [false],
      pushNotifications: [true]
    });
  }

  /**
   * Validateur pour la confirmation du mot de passe
   */
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  /**
   * Charger les données du client
   */
  loadClientData(): void {
    this.isLoading = true;
    this.clientService.getClientById(this.clientId).subscribe({
      next: (client) => {
        if (client) {
          this.client = client;
          this.populateForms(client);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.isLoading = false;
        this.showErrorMessage('Impossible de charger vos informations. Veuillez réessayer plus tard.');
      }
    });
  }

  /**
   * Remplir les formulaires avec les données du client
   */
  populateForms(client: Client): void {
    this.personalInfoForm.patchValue({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      occupation: client.occupation || '',
      birthDate: client.birthDate
    });

    this.securityForm.patchValue({
      identityType: client.identityType,
      identityNumber: client.identityNumber
    });

    this.preferencesForm.patchValue({
      contactPreference: client.contactPreference || 'EMAIL',
      accountType: client.accountType,
      currency: client.currency,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    });
  }

  /**
   * Changer d'onglet
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Soumettre les informations personnelles
   */
  onSubmitPersonalInfo(): void {
    if (this.personalInfoForm.invalid) {
      this.personalInfoForm.markAllAsTouched();
      return;
    }

    this.saveClientData('personalInfo');
  }

  /**
   * Soumettre les paramètres de sécurité
   */
  onSubmitSecurity(): void {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }

    this.saveClientData('security');
  }

  /**
   * Soumettre les préférences
   */
  onSubmitPreferences(): void {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    this.saveClientData('preferences');
  }

  /**
   * Sauvegarder les données du client
   */
  private saveClientData(formType: string): void {
    if (!this.client) return;

    this.isSaving = true;
    let updateData: Partial<Client> = {};

    switch (formType) {
      case 'personalInfo':
        updateData = { ...this.personalInfoForm.value };
        break;
      case 'security':
        const securityData = this.securityForm.value;
        updateData = {
          identityType: securityData.identityType,
          identityNumber: securityData.identityNumber
        };
        break;
      case 'preferences':
        const preferencesData = this.preferencesForm.value;
        updateData = {
          contactPreference: preferencesData.contactPreference,
          accountType: preferencesData.accountType,
          currency: preferencesData.currency
        };
        break;
    }

    // Fusionner avec les données existantes
    const updatedClient: Client = {
      ...this.client,
      ...updateData
    };

    this.clientService.updateClient(this.client.id, updatedClient).subscribe({
      next: (client) => {
        this.client = client;
        this.isSaving = false;
        this.showSuccessMessage('Informations mises à jour avec succès');
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
        this.isSaving = false;
        this.showErrorMessage('La mise à jour a échoué. Veuillez réessayer plus tard.');
      }
    });
  }

  /**
   * Changer la photo de profil
   */
  onProfilePictureChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        this.showErrorMessage('Veuillez sélectionner un fichier image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.showErrorMessage('La taille du fichier ne doit pas dépasser 5MB');
        return;
      }

      // Convertir en base64 pour l'affichage (simulation)
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.client) {
          this.client.profilePicture = e.target?.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Afficher un message de succès
   */
  private showSuccessMessage(message: string): void {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 3000);
  }

  /**
   * Afficher un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
  }

  /**
   * Fermer le message d'erreur
   */
  closeError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  /**
   * Obtenir les contrôles de formulaire
   */
  get personalControls() { return this.personalInfoForm.controls; }
  get securityControls() { return this.securityForm.controls; }
  get preferencesControls() { return this.preferencesForm.controls; }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  /**
   * Obtenir l'URL de la photo de profil
   */
  getProfilePictureUrl(): string {
    return this.client?.profilePicture || '/assets/images/default-avatar.png';
  }

  /**
   * Obtenir le nom d'affichage du client
   */
  getDisplayName(): string {
    if (!this.client) return '';
    return `${this.client.firstName} ${this.client.lastName}`;
  }

  /**
   * Formater la date d'inscription
   */
  getJoinDate(): string {
    if (!this.client?.createdAt) return '';
    return new Date(this.client.createdAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}