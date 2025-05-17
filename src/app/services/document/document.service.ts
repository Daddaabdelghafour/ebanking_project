import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Document, DocumentFilter } from '../../shared/models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  // Utilisez une URL correcte pour votre API
  private apiUrl = '/api/documents';

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les documents d'un utilisateur avec filtres optionnels
   */
  getDocuments(filter?: DocumentFilter): Observable<Document[]> {
    // Pour le développement - utilisez des données mockées en attendant que l'API soit prête
    return of(this.getMockDocuments()).pipe(
      catchError(this.handleError)
    );

    // Décommentez ce code quand votre API est prête
    /*
    let params = new HttpParams();
    
    if (filter) {
      if (filter.type) params = params.set('type', filter.type);
      if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
      if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
      if (filter.isRead !== undefined) params = params.set('isRead', filter.isRead.toString());
      if (filter.isArchived !== undefined) params = params.set('isArchived', filter.isArchived.toString());
      if (filter.searchTerm) params = params.set('search', filter.searchTerm);
    }

    return this.http.get<Document[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
    */
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Une erreur est survenue', error);
    
    // Log détaillé pour débogage
    if (error.error instanceof ErrorEvent) {
      console.error('Erreur côté client:', error.error.message);
    } else {
      console.error(`Erreur serveur: ${error.status}, message: ${error.message}`);
      console.error('Corps de la réponse:', error.error);
    }
    
    return throwError(() => new Error('Une erreur est survenue lors de la récupération des documents. Veuillez réessayer plus tard.'));
  }

  /**
   * Données fictives pour le développement
   */
  private getMockDocuments(): Document[] {
    return [
      {
        id: 'doc1',
        userId: 'user1',
        type: 'statement',
        title: 'Relevé bancaire - Mars 2025',
        description: 'Relevé mensuel de votre compte courant',
        fileUrl: 'https://example.com/docs/statement-mar-2025.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        isRead: true,
        isArchived: false,
        createdAt: new Date('2025-03-05'),
        periodStart: new Date('2025-03-01'),
        periodEnd: new Date('2025-03-31')
      },
      {
        id: 'doc2',
        userId: 'user1',
        type: 'receipt',
        title: 'Reçu - Paiement de facture',
        description: 'Reçu pour le paiement de votre facture d\'électricité',
        fileUrl: 'https://example.com/docs/receipt-electricity.pdf',
        fileSize: 120000,
        mimeType: 'application/pdf',
        isRead: false,
        isArchived: false,
        createdAt: new Date('2025-03-15')
      },
      {
        id: 'doc3',
        userId: 'user1',
        type: 'contract',
        title: 'Contrat - Carte Gold',
        description: 'Conditions générales de votre carte bancaire Gold',
        fileUrl: 'https://example.com/docs/contract-card-gold.pdf',
        fileSize: 550000,
        mimeType: 'application/pdf',
        isRead: false,
        isArchived: false,
        createdAt: new Date('2025-02-20')
      },
      {
        id: 'doc4',
        userId: 'user1',
        type: 'tax',
        title: 'Attestation fiscale 2024',
        description: 'Attestation fiscale pour vos déclarations d\'impôts',
        fileUrl: 'https://example.com/docs/tax-certificate-2024.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        isRead: true,
        isArchived: true,
        createdAt: new Date('2025-01-15')
      }
    ];
  }
}