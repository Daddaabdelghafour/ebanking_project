import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-client-enrollment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-enrollement.component.html',
  styleUrls: ['./client-enrollement.component.css']
})
export class ClientEnrollmentComponent implements OnInit {
  enrollmentForm: FormGroup;
  enrolledClients: EnrolledClient[] = [];
  showModal = false;
  isEditing = false;
  currentClientId: string | null = null;
  
  // Account types
  accountTypes = [
    { id: 'current', name: 'Compte Courant' },
    { id: 'savings', name: 'Compte Épargne' },
    { id: 'premium', name: 'Compte Premium' },
    { id: 'business', name: 'Compte Professionnel' }
  ];

  constructor(private fb: FormBuilder) {
    this.enrollmentForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      cin: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,2}[0-9]{5,6}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^(0|\+212)[5-7][0-9]{8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      accountType: ['', Validators.required],
      address: ['', Validators.required],
      birthDate: ['', Validators.required],
      occupation: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Load sample enrolled clients
    this.loadSampleClients();
  }

  loadSampleClients() {
    this.enrolledClients = [
      {
        id: '1',
        fullName: 'Ahmed Benjelloun',
        cin: 'BK12345',
        phone: '+212612345678',
        email: 'ahmed.b@example.com',
        accountType: 'current',
        isActive: true,
        enrollmentDate: new Date(2023, 3, 15),
        address: '123 Rue Mohammed V, Casablanca',
        birthDate: new Date(1985, 5, 12),
        occupation: 'Ingénieur',
        notes: 'Client référé par un autre client'
      },
      {
        id: '2',
        fullName: 'Fatima El Alaoui',
        cin: 'CD56789',
        phone: '+212698765432',
        email: 'fatima.e@example.com',
        accountType: 'savings',
        isActive: true,
        enrollmentDate: new Date(2023, 4, 3),
        address: '45 Avenue Hassan II, Rabat',
        birthDate: new Date(1990, 8, 23),
        occupation: 'Médecin',
        notes: ''
      },
      {
        id: '3',
        fullName: 'Karim Naciri',
        cin: 'EF98765',
        phone: '+212654321987',
        email: 'karim.n@example.com',
        accountType: 'business',
        isActive: false,
        enrollmentDate: new Date(2023, 2, 7),
        address: '78 Boulevard Zerktouni, Marrakech',
        birthDate: new Date(1975, 2, 5),
        occupation: 'Entrepreneur',
        notes: 'Documents à compléter'
      }
    ];
  }

  submitForm() {
    if (this.enrollmentForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.enrollmentForm.controls).forEach(key => {
        this.enrollmentForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formData = this.enrollmentForm.value;
    
    if (this.isEditing && this.currentClientId) {
      // Update existing client
      const index = this.enrolledClients.findIndex(c => c.id === this.currentClientId);
      if (index !== -1) {
        this.enrolledClients[index] = {
          ...this.enrolledClients[index],
          ...formData
        };
      }
      this.isEditing = false;
      this.currentClientId = null;
    } else {
      // Add new client
      const newClient: EnrolledClient = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        enrollmentDate: new Date()
      };
      this.enrolledClients.unshift(newClient);
    }

    // Reset form
    this.enrollmentForm.reset();
    // Select the first account type as default
    this.enrollmentForm.patchValue({
      accountType: ''
    });
  }

  getAccountTypeName(typeId: string): string {
    const accountType = this.accountTypes.find(type => type.id === typeId);
    return accountType ? accountType.name : 'Unknown';
  }

  showValidationError(controlName: string): boolean {
    const control = this.enrollmentForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  editClient(client: EnrolledClient) {
    this.isEditing = true;
    this.currentClientId = client.id;
    
    this.enrollmentForm.patchValue({
      fullName: client.fullName,
      cin: client.cin,
      phone: client.phone,
      email: client.email,
      accountType: client.accountType,
      address: client.address,
      birthDate: client.birthDate ? this.formatDateForInput(client.birthDate) : '',
      occupation: client.occupation,
      notes: client.notes
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteClient(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client?')) {
      this.enrolledClients = this.enrolledClients.filter(client => client.id !== id);
    }
  }

  toggleClientStatus(id: string) {
    const index = this.enrolledClients.findIndex(client => client.id === id);
    if (index !== -1) {
      this.enrolledClients[index].isActive = !this.enrolledClients[index].isActive;
    }
  }

  // Format date for input field (YYYY-MM-DD)
  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // For display in the table
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  cancelEdit() {
    this.isEditing = false;
    this.currentClientId = null;
    this.enrollmentForm.reset();
    this.enrollmentForm.patchValue({
      accountType: ''
    });
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  openClientDetails(client: EnrolledClient) {
    console.log('View details for client', client);
    // Implement client details modal/page navigation
  }
}

interface EnrolledClient {
  id: string;
  fullName: string;
  cin: string;
  phone: string;
  email: string;
  accountType: string;
  isActive: boolean;
  enrollmentDate: Date;
  address: string;
  birthDate?: Date;
  occupation?: string;
  notes?: string;
}