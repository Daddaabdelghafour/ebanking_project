import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Document, DocumentFilter } from '../../shared/models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `http://localhost:8085/E-BANKING1/api/documents`;

  constructor(private http: HttpClient) { }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(this.apiUrl);
  }

  getDocumentById(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}/${id}`);
  }

  getDocumentsByType(type: string): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/type/${type}`);
  }

  getUnreadDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/unread`);
  }

  getArchivedDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/archived`);
  }

  getDocumentsByDateRange(start: Date, end: Date): Observable<Document[]> {
    let params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());
    
    return this.http.get<Document[]>(`${this.apiUrl}/date-range`, { params });
  }

  markAsRead(id: string): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/mark-as-read`, {});
  }

  toggleArchiveStatus(id: string, archive: boolean): Observable<Document> {
    return this.http.put<Document>(`${this.apiUrl}/${id}/archive`, {});
  }

  getBankStatement(accountId: string, clientId: string): Observable<Document> {
    let params = new HttpParams()
      .set('accountid', accountId)
      .set('clientid', clientId);
    
    return this.http.get<Document>(`${this.apiUrl}/relverBancair`, { params });
  }
}