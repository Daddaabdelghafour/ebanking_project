import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document, DocumentFilter, DocumentType } from '../../../shared/models/document.model';
import { DocumentService } from '../../../services/document/document.service';
import { SafePipe } from '../../../shared/pipes/safe.pipe';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, SafePipe],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  isLoading = true;
  filter: DocumentFilter = {};
  documentTypes: DocumentType[] = ['statement', 'receipt', 'contract', 'tax', 'other'];
  
  selectedDocument?: Document;
  showDocumentViewer = false;
  error = '';

  constructor(private documentService: DocumentService) { }

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error = '';
    
    this.documentService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.filteredDocuments = [...documents];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading documents', error);
        this.error = 'Impossible de charger vos documents. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    // Pour une version simple, nous filtrons localement
    this.filteredDocuments = this.documents.filter(doc => {
      // Type filter
      if (this.filter.type && doc.type !== this.filter.type) {
        return false;
      }
      
      // Read status filter
      if (this.filter.isRead !== undefined && doc.isRead !== this.filter.isRead) {
        return false;
      }
      
      // Archive status filter
      if (this.filter.isArchived !== undefined && doc.isArchived !== this.filter.isArchived) {
        return false;
      }
      
      // Date range filter
      if (this.filter.startDate && new Date(doc.createdAt) < new Date(this.filter.startDate)) {
        return false;
      }
      
      if (this.filter.endDate && new Date(doc.createdAt) > new Date(this.filter.endDate)) {
        return false;
      }
      
      // Search filter
      if (this.filter.searchTerm && !doc.title.toLowerCase().includes(this.filter.searchTerm.toLowerCase()) && 
          (!doc.description || !doc.description.toLowerCase().includes(this.filter.searchTerm.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  }

  resetFilters(): void {
    this.filter = {};
    this.filteredDocuments = [...this.documents];
  }

  viewDocument(document: Document): void {
    this.selectedDocument = document;
    this.showDocumentViewer = true;
    
    // Marquer comme lu
    document.isRead = true;
  }

  closeViewer(): void {
    this.showDocumentViewer = false;
    this.selectedDocument = undefined;
  }

  downloadDocument(document: Document): void {
    // Dans une vraie application, cela ferait un appel API
    // Pour l'instant, simulons simplement un téléchargement en ouvrant l'URL
    window.open(document.fileUrl, '_blank');
  }
  
  openDocument(document: Document): void {
    window.open(document.fileUrl, '_blank');
  }

  toggleArchiveStatus(document: Document): void {
    document.isArchived = !document.isArchived;
    // Dans une vraie application, vous feriez un appel API ici
  }

  getDocumentTypeLabel(type: DocumentType): string {
    switch(type) {
      case 'statement': return 'Relevé';
      case 'receipt': return 'Reçu';
      case 'contract': return 'Contrat';
      case 'tax': return 'Fiscal';
      default: return 'Autre';
    }
  }
}