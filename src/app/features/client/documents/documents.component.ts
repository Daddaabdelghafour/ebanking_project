import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Document } from '../../../shared/models/document.model';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface DocumentFilters {
  type: string;
  status: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  // Chargement et données
  isLoading = false;
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  
  // Listes pour les sélecteurs
  documentTypes = ['statement', 'receipt', 'contract', 'tax', 'other'];
  
  // Filtres
  filters: DocumentFilters = {
    type: '',
    status: ''
  };

  private apiUrl = 'http://localhost:8085/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    
    // Charger les documents du client connecté
    this.http.get<Document[]>(`${this.apiUrl}/documents`).pipe(
      tap(documents => {
        this.documents = documents;
        this.applyFilters();
      }),
      catchError(err => {
        console.error('Erreur lors du chargement des documents:', err);
        this.createDemoDocuments();
        this.applyFilters();
        return of([]);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter(doc => {
      // Filtre par type
      if (this.filters.type && doc.type !== this.filters.type) {
        return false;
      }
      
      // Filtre par statut
      if (this.filters.status === 'unread' && doc.isRead) {
        return false;
      }
      if (this.filters.status === 'read' && (!doc.isRead || doc.isArchived)) {
        return false;
      }
      if (this.filters.status === 'archived' && !doc.isArchived) {
        return false;
      }
      
      return true;
    });
  }

  resetFilters(): void {
    this.filters = {
      type: '',
      status: ''
    };
    this.applyFilters();
  }

  openDocument(doc: Document): void {
    if (!doc.isRead) {
      // Marquer comme lu
      this.http.put(`${this.apiUrl}/documents/${doc.id}/mark-as-read`, {}).pipe(
        tap(() => {
          doc.isRead = true;
          this.applyFilters(); // Mettre à jour l'affichage
        }),
        catchError(err => {
          console.error('Erreur lors du marquage du document comme lu:', err);
          // En mode démo, on met quand même à jour localement
          doc.isRead = true;
          this.applyFilters();
          return of(null);
        })
      ).subscribe();
    }
    
    // Ouvrir le document dans un nouvel onglet
    window.open(doc.fileUrl, '_blank');
  }

  toggleArchiveDocument(doc: Document): void {
    const endpoint = doc.isArchived ? 
      `${this.apiUrl}/documents/${doc.id}/unarchive` : 
      `${this.apiUrl}/documents/${doc.id}/archive`;
    
    this.http.put(endpoint, {}).pipe(
      tap(() => {
        doc.isArchived = !doc.isArchived;
        this.applyFilters();
      }),
      catchError(err => {
        console.error(`Erreur lors du changement d'archivage du document:`, err);
        // En mode démo, on met quand même à jour localement
        doc.isArchived = !doc.isArchived;
        this.applyFilters();
        return of(null);
      })
    ).subscribe();
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

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private createDemoDocuments(): void {
    const now = new Date();
    
    this.documents = [
      {
        id: '1',
        title: 'Relevé de compte Mai 2025',
        type: 'statement',
        fileUrl: 'assets/sample/statement.pdf',
        fileSize: 256000,
        isRead: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        userId: 'current-user'
      } as Document,
      {
        id: '2',
        title: 'Contrat de compte courant',
        type: 'contract',
        fileUrl: 'assets/sample/contract.pdf',
        fileSize: 512000,
        isRead: true,
        isArchived: false,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'current-user'
      } as Document,
      {
        id: '3',
        title: 'Attestation fiscale 2024',
        type: 'tax',
        fileUrl: 'assets/sample/tax.pdf',
        fileSize: 128000,
        isRead: true,
        isArchived: true,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'current-user'
      } as Document,
      {
        id: '4',
        title: 'Reçu de virement - Mars 2025',
        type: 'receipt',
        fileUrl: 'assets/sample/receipt.pdf',
        fileSize: 85000,
        isRead: false,
        isArchived: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'current-user'
      } as Document,
      {
        id: '5',
        title: 'Conditions générales - Compte épargne',
        type: 'contract',
        fileUrl: 'assets/sample/conditions.pdf',
        fileSize: 320000,
        isRead: true,
        isArchived: false,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 'current-user'
      } as Document
    ];
  }
}