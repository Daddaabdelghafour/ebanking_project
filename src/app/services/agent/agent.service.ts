import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Agent, AgentFormData } from '../../shared/models/agent.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les agents
   */
  getAgents(): Observable<Agent[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agents`)
      .pipe(
        map(agentsDto => this.mapAgentsFromDto(agentsDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un agent par son ID
   */
  getAgentById(id: string): Observable<Agent> {
    return this.http.get<any>(`${this.apiUrl}/agents/${id}`)
      .pipe(
        map(agentDto => this.mapAgentFromDto(agentDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Crée un nouvel agent
   */
  createAgent(agentData: AgentFormData): Observable<Agent> {
    // Mapper les données du formulaire vers l'entité Agent attendue par le backend
    const agentEntity = {
      employeeId: agentData.employeeId,
      branch: agentData.branch,
      role: agentData.role,
      status: agentData.status,
      dateJoined: new Date().toISOString(),
      user: {
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        email: agentData.email,
        phoneNumber: agentData.phone,
        passwordHash: agentData.password,
        role: 'AGENT',
        isActive: agentData.status === 'active',
        language: 'fr',
        gdprConsent: true,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    return this.http.post<any>(`${this.apiUrl}/agents`, agentEntity)
      .pipe(
        map(agentDto => this.mapAgentFromDto(agentDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour un agent existant
   */
  updateAgent(id: string, agentData: AgentFormData): Observable<Agent> {
    // Mapper les données du formulaire vers le DTO attendu par le backend
    const agentDto = {
      employeeId: agentData.employeeId,
      branch: agentData.branch,
      role: agentData.role,
      status: agentData.status,
      firstName: agentData.firstName,
      lastName: agentData.lastName,
      email: agentData.email,
      phoneNumber: agentData.phone
      // Note: Ne pas inclure le mot de passe s'il est vide (pour les mises à jour)
    };

    // Ajouter le mot de passe seulement s'il est fourni
    if (agentData.password && agentData.password.trim() !== '') {
      (agentDto as any).passwordHash = agentData.password;
    }

    return this.http.put<any>(`${this.apiUrl}/agents/${id}`, agentDto)
      .pipe(
        map(agentDto => this.mapAgentFromDto(agentDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un agent
   */
  deleteAgent(id: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/agents/${id}`)
      .pipe(
        map(() => true),
        catchError(error => {
          console.error('Error deleting agent:', error);
          return of(false);
        })
      );
  }

  /**
   * Met à jour le statut d'un agent
   */
  updateAgentStatus(id: string, status: string): Observable<Agent> {
    return this.http.put<any>(`${this.apiUrl}/agents/${id}/status/${status}`, {})
      .pipe(
        map(agentDto => this.mapAgentFromDto(agentDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les agents par statut
   */
  getAgentsByStatus(status: string): Observable<Agent[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agents/status/${status}`)
      .pipe(
        map(agentsDto => this.mapAgentsFromDto(agentsDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les agents par agence
   */
  getAgentsByBranch(branch: string): Observable<Agent[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agents/branch/${branch}`)
      .pipe(
        map(agentsDto => this.mapAgentsFromDto(agentsDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un agent par son employeeId
   */
  getAgentByEmployeeId(employeeId: string): Observable<Agent> {
    return this.http.get<any>(`${this.apiUrl}/agents/employee/${employeeId}`)
      .pipe(
        map(agentDto => this.mapAgentFromDto(agentDto)),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère la liste des agences (mock data pour maintenant)
   */
  getBranches(): Observable<string[]> {
    // TODO: Remplacer par un vrai endpoint si disponible
    const branches = [
      'Agence Casablanca Centre',
      'Agence Rabat Agdal',
      'Agence Marrakech Gueliz',
      'Agence Fès Saiss',
      'Agence Tanger Ville',
      'Agence Agadir Centre',
      'Agence Meknès',
      'Agence Oujda',
      'Agence Kenitra',
      'Agence Tétouan'
    ];
    return of(branches);
  }

  /**
   * Récupère la liste des rôles (mock data pour maintenant)
   */
  getRoles(): Observable<string[]> {
    // TODO: Remplacer par un vrai endpoint si disponible
    const roles = [
      'Agent Commercial',
      'Conseiller Clientèle',
      'Responsable Agence',
      'Agent de Crédit',
      'Caissier',
      'Chargé de Clientèle Entreprise',
      'Agent Back Office',
      'Superviseur'
    ];
    return of(roles);
  }

  /**
   * Mappe un DTO agent vers le modèle Agent
   */
  private mapAgentFromDto(agentDto: any): Agent {
    return {
      id: agentDto.id,
      employeeId: agentDto.employeeId,
      firstName: agentDto.firstName || agentDto.user?.firstName || '',
      lastName: agentDto.lastName || agentDto.user?.lastName || '',
      email: agentDto.email || agentDto.user?.email || '',
      phone: agentDto.phoneNumber || agentDto.user?.phoneNumber || '',
      branch: agentDto.branch || '',
      role: agentDto.role || '',
      status: agentDto.status || 'active',
      dateJoined: agentDto.dateJoined || agentDto.createdAt || new Date().toISOString(),
      lastLogin: agentDto.lastLogin || agentDto.user?.lastLogin || null,
      isActive: agentDto.status === 'active',
      userId: agentDto.userId || agentDto.user?.id || null
    };
  }

  /**
   * Mappe un tableau de DTOs agents vers le modèle Agent
   */
  private mapAgentsFromDto(agentsDto: any[]): Agent[] {
    return agentsDto.map(agentDto => this.mapAgentFromDto(agentDto));
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = 'Conflit - L\'agent existe déjà';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('AgentService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}