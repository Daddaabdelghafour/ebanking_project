import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DocumentService } from '../../../services/document/document.service';
import { Client } from '../../../shared/models/client.model';
import { Account } from '../../../shared/models/account.model';
import { Document } from '../../../shared/models/document.model';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-document-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './document-management.component.html',
  styleUrl: './document-management.component.css'
})
export class DocumentManagementComponent implements OnInit {
  documentForm!: FormGroup;
  showErrors = false;
  
  clients: Client[] = [];
  clientAccounts: Account[] = [];
  
  selectedFile: File | null = null;
  fileError = '';
  
  isLoading = false;
  isUploading = false;
  isLoadingRecent = false;
  
  recentDocuments: Document[] = [];
  
  successMessage = '';
  errorMessage = '';
  
  // URL API directe
  private apiUrl = 'http://localhost:8085/api';
  private mockApi = true; // Mode démo activé par défaut
  
  // Types de documents pour le select
  documentTypes = ['statement', 'receipt', 'contract', 'tax', 'other'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private documentService: DocumentService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadRecentDocuments();
  }

  private initForm(): void {
    this.documentForm = this.fb.group({
      clientId: [null, Validators.required],
      accountId: [null, Validators.required],
      type: [null, Validators.required],
      title: ['', Validators.required],
      description: ['']
    });
  }

  get f() {
    return this.documentForm.controls;
  }

  loadClients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<Client[]>(`${this.apiUrl}/clients`).pipe(
      tap(clients => {
        this.clients = clients;
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des clients:', err);
        this.createDemoClients();
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  loadClientAccounts(): void {
    const clientId = this.f['clientId'].value;
    if (!clientId) return;

    this.f['accountId'].setValue(null);
    this.clientAccounts = [];
    
    this.isLoading = true;
    
    this.http.get<Account[]>(`${this.apiUrl}/accounts/client/${clientId}`).pipe(
      tap(accounts => {
        this.clientAccounts = accounts;
      }),
      catchError(err => {
        this.createDemoAccounts(clientId);
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  loadRecentDocuments(): void {
    this.isLoadingRecent = true;
    
    this.http.get<Document[]>(`${this.apiUrl}/documents/agent/recent`).pipe(
      tap(documents => {
        this.recentDocuments = documents;
      }),
      catchError(err => {
        this.createDemoDocuments();
        return of([]);
      }),
      finalize(() => this.isLoadingRecent = false)
    ).subscribe();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.fileError = '';
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.fileError = 'Le fichier est trop volumineux (limite: 10MB).';
        this.selectedFile = null;
        return;
      }

      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.fileError = 'Type de fichier non supporté. Utilisez PDF, DOCX, DOC, JPEG ou PNG.';
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
    }
  }

  resetFile(): void {
    this.selectedFile = null;
    this.fileError = '';
  }

  sendDocument(): void {
    this.showErrors = true;
    
    if (this.documentForm.invalid || !this.selectedFile) {
      return;
    }
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('clientId', this.f['clientId'].value);
    formData.append('accountId', this.f['accountId'].value);
    formData.append('type', this.f['type'].value);
    formData.append('title', this.f['title'].value);
    formData.append('description', this.f['description'].value || '');
    
    this.isUploading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.http.post<Document>(`${this.apiUrl}/documents/upload`, formData).pipe(
      tap(response => {
        this.successMessage = 'Document envoyé avec succès au client.';
        this.resetForm();
        this.loadRecentDocuments();
      }),
      catchError(error => {
        console.error('Erreur lors de l\'envoi du document:', error);
        
        // Mode démo
        if (this.mockApi) {
          this.successMessage = 'Document envoyé avec succès au client. (Mode démo)';
          this.resetForm();
          this.loadRecentDocuments();
        } else {
          this.errorMessage = 'Erreur lors de l\'envoi du document. Veuillez réessayer.';
        }
        return of(null);
      }),
      finalize(() => this.isUploading = false)
    ).subscribe();
  }

  resetForm(): void {
    this.documentForm.reset();
    this.selectedFile = null;
    this.fileError = '';
    this.showErrors = false;
  }

  getAccountTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      'CHECKING': 'Compte courant',
      'SAVINGS': 'Compte d\'épargne',
      'CREDIT': 'Compte de crédit',
      'INVESTMENT': 'Compte d\'investissement'
    };
    
    return typeLabels[type] || type;
  }

  getDocumentTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      'statement': 'Relevé bancaire',
      'receipt': 'Reçu',
      'contract': 'Contrat',
      'tax': 'Document fiscal',
      'other': 'Autre'
    };
    
    return typeLabels[type] || 'Autre';
  }

  generateBankStatement(): void {
    const clientId = this.f['clientId'].value;
    const accountId = this.f['accountId'].value;
    
    if (!clientId || !accountId) return;
    
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.http.get<Document>(`${this.apiUrl}/documents/relverBancair?clientid=${clientId}&accountid=${accountId}`).pipe(
      tap(document => {
        this.successMessage = 'Relevé bancaire généré et envoyé au client avec succès.';
        this.loadRecentDocuments();
        
        this.documentForm.patchValue({
          type: null,
          title: '',
          description: ''
        });
      }),
      catchError(error => {
        // Mode démo
        if (this.mockApi) {
          this.successMessage = 'Relevé bancaire généré et envoyé au client avec succès. (Mode démo)';
          this.loadRecentDocuments();
        } else {
          this.errorMessage = 'Erreur lors de la génération du relevé bancaire.';
        }
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  generateTaxDocument(): void {
    const clientId = this.f['clientId'].value;
    const accountId = this.f['accountId'].value;
    
    if (!clientId || !accountId) return;
    
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    this.http.get<Document>(`${this.apiUrl}/documents/generate/tax?clientId=${clientId}&accountId=${accountId}`).pipe(
      tap(document => {
        this.successMessage = 'Attestation fiscale générée et envoyée au client avec succès.';
        this.loadRecentDocuments();
        
        this.documentForm.patchValue({
          type: null,
          title: '',
          description: ''
        });
      }),
      catchError(error => {
        // Mode démo
        if (this.mockApi) {
          this.successMessage = 'Attestation fiscale générée et envoyée au client avec succès. (Mode démo)';
          this.loadRecentDocuments();
        } else {
          this.errorMessage = 'Erreur lors de la génération de l\'attestation fiscale.';
        }
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  // Méthodes pour créer des données de démo
  private createDemoClients(): void {
    this.clients = [
      { id: 'client1', firstName: 'Mohammed', lastName: 'Alami', clientId: 'CLI001', email: 'malami@example.com', status: 'active' } as Client,
      { id: 'client2', firstName: 'Fatima', lastName: 'Benali', clientId: 'CLI002', email: 'fbenali@example.com', status: 'active' } as Client,
      { id: 'client3', firstName: 'Youssef', lastName: 'Mansouri', clientId: 'CLI003', email: 'ymansouri@example.com', status: 'active' } as Client
    ];
  }

  private createDemoAccounts(clientId: string): void {
    this.clientAccounts = [
      {
        id: 'acc1',
        accountNumber: '1234567890',
        type: 'CHECKING',
        balance: 25000,
        availableBalance: 25000,
        currency: 'MAD',
        status: 'active',
        clientId: clientId
      } as Account,
      {
        id: 'acc2',
        accountNumber: '0987654321',
        type: 'SAVINGS',
        balance: 50000,
        availableBalance: 50000,
        currency: 'MAD',
        status: 'active',
        clientId: clientId
      } as Account
    ];
  }

  private createDemoDocuments(): void {
    this.recentDocuments = [
      {
        id: '1',
        title: 'Relevé de compte Mai 2025',
        type: 'statement',
        fileUrl: 'assets/sample/statement.pdf',
        fileSize: 256000,
        isRead: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        userId: 'client1'
      } as Document,
      {
        id: '2',
        title: 'Contrat de compte courant',
        type: 'contract',
        fileUrl: 'assets/sample/contract.pdf',
        fileSize: 512000,
        isRead: true,
        isArchived: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        userId: 'client2'
      } as Document
    ];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
}