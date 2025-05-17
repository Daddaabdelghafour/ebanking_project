import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Announcement , AnnouncementFilter , AnnouncementCategory } from '../../shared/models/Announcement.model';
@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = '/api/announcements';

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les annonces avec filtres optionnels
   */
  getAnnouncements(filter?: AnnouncementFilter): Observable<Announcement[]> {
    // Utiliser des données mockées pour le développement
    return of(this.getMockAnnouncements()).pipe(
      catchError(this.handleError)
    );

    // Code pour l'API réelle - à décommenter quand l'API est disponible
    /*
    let params = new HttpParams();
    
    if (filter) {
      if (filter.category) params = params.set('category', filter.category);
      if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
      if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
      if (filter.isImportant !== undefined) params = params.set('isImportant', filter.isImportant.toString());
      if (filter.search) params = params.set('search', filter.search);
    }
    
    return this.http.get<Announcement[]>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
    */
  }

  /**
   * Récupère une annonce spécifique
   */
  getAnnouncementById(id: string): Observable<Announcement> {
    const announcement = this.getMockAnnouncements().find(a => a.id === id);
    if (announcement) {
      return of(announcement).pipe(catchError(this.handleError));
    }
    return throwError(() => new Error('Announcement not found'));

    // return this.http.get<Announcement>(`${this.apiUrl}/${id}`).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Récupère les annonces importantes actives
   */
  getImportantAnnouncements(): Observable<Announcement[]> {
    const importantAnnouncements = this.getMockAnnouncements().filter(a => a.isImportant);
    return of(importantAnnouncements).pipe(catchError(this.handleError));

    // return this.http.get<Announcement[]>(`${this.apiUrl}/important`).pipe(
    //   catchError(this.handleError)
    // );
  }

  /**
   * Marque une annonce comme lue (pour le suivi utilisateur)
   */
  markAsRead(id: string): Observable<{ success: boolean }> {
    // Simuler une réponse réussie
    return of({ success: true }).pipe(catchError(this.handleError));

    // return this.http.post<{ success: boolean }>(`${this.apiUrl}/${id}/read`, {}).pipe(
    //   catchError(this.handleError)
    // );
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
    
    return throwError(() => new Error('Une erreur est survenue lors de la récupération des annonces. Veuillez réessayer plus tard.'));
  }

  /**
   * Données mockées pour les annonces
   */
  private getMockAnnouncements(): Announcement[] {
    return [
      {
        id: 'ann1',
        title: 'Maintenance du système bancaire',
        content: 'Nous effectuerons une maintenance programmée du système le samedi 20 mai de 23h00 à 02h00. Pendant cette période, l\'application mobile et le site web seront temporairement indisponibles. Nous nous excusons pour tout inconvénient occasionné.',
        date: new Date('2025-05-15'),
        author: 'Équipe Technique',
        isImportant: true,
        category: 'maintenance',
        createdAt: new Date('2025-05-15'),
        updatedAt: new Date('2025-05-15')
      },
      {
        id: 'ann2',
        title: 'Nouvelle fonctionnalité : Paiement instantané',
        content: 'Nous sommes ravis de vous annoncer le lancement de notre nouvelle fonctionnalité de paiement instantané. Vous pouvez désormais effectuer des virements qui seront crédités en quelques secondes, 24h/24 et 7j/7. Cette fonctionnalité est disponible dès maintenant dans votre application.',
        date: new Date('2025-04-28'),
        author: 'Équipe Produit',
        isImportant: false,
        category: 'new_feature',
        createdAt: new Date('2025-04-28')
      },
      {
        id: 'ann3',
        title: 'Alerte de sécurité : Tentatives de phishing',
        content: 'Nous avons identifié une campagne de phishing ciblant nos clients. Rappel : notre banque ne vous demandera JAMAIS vos informations sensibles par email ou SMS. Ne cliquez pas sur les liens suspects et vérifiez toujours l\'URL avant de vous connecter à notre site.',
        date: new Date('2025-04-15'),
        author: 'Équipe Sécurité',
        isImportant: true,
        category: 'security',
        createdAt: new Date('2025-04-15'),
        updatedAt: new Date('2025-04-16')
      },
      {
        id: 'ann4',
        title: 'Promotion : Taux préférentiel sur les prêts immobiliers',
        content: 'Du 1er au 31 mai, profitez d\'un taux exceptionnel de 2,5% sur nos prêts immobiliers pour tout achat de résidence principale. Prenez rendez-vous avec votre conseiller pour en savoir plus et simuler votre prêt.',
        date: new Date('2025-05-01'),
        author: 'Service Marketing',
        isImportant: false,
        category: 'promotion',
        createdAt: new Date('2025-05-01')
      },
      {
        id: 'ann5',
        title: 'Webinaire : Investir dans un marché volatile',
        content: 'Rejoignez-nous le 25 mai à 18h pour un webinaire exclusif sur les stratégies d\'investissement en période de volatilité. Notre expert en marchés financiers partagera ses conseils pour sécuriser et optimiser votre portefeuille.',
        date: new Date('2025-05-10'),
        author: 'Service Investissement',
        isImportant: false,
        category: 'event',
        createdAt: new Date('2025-05-10')
      }
    ];
  }
}