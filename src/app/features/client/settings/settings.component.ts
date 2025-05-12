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
  
  personalInfoForm: FormGroup;
  contactPreferences = [
    { value: 'Email', label: 'Email' },
    { value: 'Phone', label: 'Téléphone' },
    { value: 'SMS', label: 'SMS' },
    { value: 'Mail', label: 'Courrier postal' }
  ];

  constructor(
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    // Initialize form with empty values
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+\d{1,3})?\s?\d{9,10}$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      occupation: [''],
      contactPreference: ['Email']
    });
  }

  ngOnInit(): void {
    this.loadClientData();
  }

  loadClientData(): void {
    // Pour la démo, on utilise le premier client
    // Dans une app réelle, vous récupéreriez l'ID client depuis le service d'authentification
    const clientId = 'cl1';
    
    this.clientService.getClientById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.client = client;
          
          // Populate the form with client data
          this.personalInfoForm.patchValue({
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            address: client.address,
            city: client.city,
            occupation: client.occupation || '',
            contactPreference: client.contactPreference || 'Email'
          });
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données client', err);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = 'Impossible de charger vos informations. Veuillez réessayer plus tard.';
      }
    });
  }

  onSubmit(): void {
    if (this.personalInfoForm.invalid) {
      this.personalInfoForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.personalInfoForm.value;
    
    // Use client service to update client info
    if (this.client) {
      this.clientService.updateClient(this.client.id, {
        ...formData,
        // Include required fields from original client data
        identityType: this.client.identityType,
        identityNumber: this.client.identityNumber,
        birthDate: this.client.birthDate,
        status: this.client.status,
        accountType: this.client.accountType,
        currency: this.client.currency
      }).subscribe({
        next: (updatedClient) => {
          this.client = updatedClient;
          this.isSaving = false;
          this.showSuccess = true;
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            this.showSuccess = false;
          }, 3000);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du profil', err);
          this.isSaving = false;
          this.showError = true;
          this.errorMessage = 'La mise à jour a échoué. Veuillez réessayer plus tard.';
        }
      });
    }
  }

  // Helper methods for form validation
  get f() { 
    return this.personalInfoForm.controls; 
  }
  
  hasError(controlName: string, errorName: string): boolean {
    const control = this.personalInfoForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  closeError(): void {
    this.showError = false;
  }
}