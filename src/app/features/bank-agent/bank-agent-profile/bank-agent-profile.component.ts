import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-bank-agent-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bank-agent-profile.component.html',
  styleUrls: ['./bank-agent-profile.component.css']
})
export class BankAgentProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isEditing = false;
  showSaveSuccess = false;
  showPasswordSuccess = false;
  
  // Agent data - in a real app, this would come from a service
  agent = {
    id: 'AGT-7845',
    name: 'Sarah Martin',
    email: 'sarah.martin@bankname.ma',
    phone: '0612345678',
    branch: 'Agence Casablanca Centre',
    role: 'Agent Bancaire',
    employeeId: 'EMP-23456',
    joinDate: new Date(2018, 5, 12),
    manager: 'Mohammed Tazi',
    specialization: 'Client onboarding, Transaction verification',
    performance: {
      lastMonth: 95,
      currentMonth: 87,
      clients: 342,
      transactions: 1245
    }
  };
  
  // Activity log
  recentActivity = [
    { 
      action: 'Vérification transaction',
      details: 'TRX-12350 approuvée',
      timestamp: new Date(2023, 4, 15, 10, 45)
    },
    { 
      action: 'Inscription client',
      details: 'CLT-7823: Ahmed El Mansouri',
      timestamp: new Date(2023, 4, 15, 9, 30)
    },
    { 
      action: 'Connexion système',
      details: 'Connexion depuis Agence Casablanca Centre',
      timestamp: new Date(2023, 4, 15, 8, 15)
    },
    { 
      action: 'Modification profil',
      details: 'Mise à jour numéro de téléphone',
      timestamp: new Date(2023, 4, 14, 16, 20)
    },
    { 
      action: 'Transaction signalée',
      details: 'TRX-12346 marquée pour vérification supplémentaire',
      timestamp: new Date(2023, 4, 14, 14, 50)
    }
  ];

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: [this.agent.name, Validators.required],
      email: [this.agent.email, [Validators.required, Validators.email]],
      phone: [this.agent.phone, [Validators.required, Validators.pattern(/^(06|07)[0-9]{8}$/)]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Any additional initialization
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  toggleEditProfile(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileForm.patchValue({
        name: this.agent.name,
        email: this.agent.email,
        phone: this.agent.phone
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      // Update profile data - in a real app, this would be saved to the server
      this.agent = {
        ...this.agent,
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
        phone: this.profileForm.value.phone
      };
      
      this.isEditing = false;
      this.showSaveSuccess = true;
      setTimeout(() => {
        this.showSaveSuccess = false;
      }, 3000);
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      console.log('Password change requested', this.passwordForm.value);
      
      // In a real app, this would send the password change request to the server
      this.passwordForm.reset();
      this.showPasswordSuccess = true;
      setTimeout(() => {
        this.showPasswordSuccess = false;
      }, 3000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  
  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}