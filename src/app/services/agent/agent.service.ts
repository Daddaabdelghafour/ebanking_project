import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Agent, AgentFormData } from '../../shared/models/agent.model';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private mockAgents: Agent[] = [
    {
      id: 'ag1',
      firstName: 'Hassan',
      lastName: 'Alaoui',
      email: 'hassan.alaoui@bank.com',
      phone: '+212 612345678',
      employeeId: 'EMP001',
      branch: 'Casablanca - Main Branch',
      role: 'Senior Agent',
      status: 'active',
      imageUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      dateJoined: new Date('2021-01-15'),
      lastLogin: new Date('2023-05-10T09:30:00')
    },
    {
      id: 'ag2',
      firstName: 'Fatima',
      lastName: 'Benali',
      email: 'fatima.benali@bank.com',
      phone: '+212 623456789',
      employeeId: 'EMP002',
      branch: 'Rabat - Central Branch',
      role: 'Junior Agent',
      status: 'active',
      imageUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      dateJoined: new Date('2022-03-20'),
      lastLogin: new Date('2023-05-11T14:45:00')
    },
    {
      id: 'ag3',
      firstName: 'Karim',
      lastName: 'El Mansouri',
      email: 'karim.elmansouri@bank.com',
      phone: '+212 634567890',
      employeeId: 'EMP003',
      branch: 'Tangier - Port Branch',
      role: 'Senior Agent',
      status: 'inactive',
      imageUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
      dateJoined: new Date('2020-06-10'),
      lastLogin: new Date('2023-01-22T11:15:00')
    },
    {
      id: 'ag4',
      firstName: 'Amina',
      lastName: 'Zidane',
      email: 'amina.zidane@bank.com',
      phone: '+212 645678901',
      employeeId: 'EMP004',
      branch: 'Marrakech - Medina Branch',
      role: 'Senior Agent',
      status: 'active',
      imageUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      dateJoined: new Date('2021-09-05'),
      lastLogin: new Date('2023-05-09T16:20:00')
    },
    {
      id: 'ag5',
      firstName: 'Youssef',
      lastName: 'Belkadi',
      email: 'youssef.belkadi@bank.com',
      phone: '+212 656789012',
      employeeId: 'EMP005',
      branch: 'Agadir - Beach Branch',
      role: 'Junior Agent',
      status: 'pending',
      imageUrl: 'https://randomuser.me/api/portraits/men/5.jpg',
      dateJoined: new Date('2023-04-01'),
      lastLogin: undefined
    }
  ];

  constructor(private http: HttpClient) {}

  getAgents(): Observable<Agent[]> {
    // In a real app, this would call an API
    return of(this.mockAgents).pipe(delay(500));
  }

  getAgentById(id: string): Observable<Agent | undefined> {
    // In a real app, this would call an API
    const agent = this.mockAgents.find(a => a.id === id);
    return of(agent).pipe(delay(300));
  }

  createAgent(agentData: AgentFormData): Observable<Agent> {
    // In a real app, this would call an API
    const newAgent: Agent = {
      id: 'ag' + (this.mockAgents.length + 1),
      ...agentData,
      dateJoined: new Date(),
      lastLogin: undefined
    };
    
    this.mockAgents.push(newAgent);
    return of(newAgent).pipe(delay(500));
  }

  updateAgent(id: string, agentData: AgentFormData): Observable<Agent> {
    // In a real app, this would call an API
    const index = this.mockAgents.findIndex(a => a.id === id);
    if (index !== -1) {
      const updatedAgent: Agent = {
        ...this.mockAgents[index],
        ...agentData
      };
      this.mockAgents[index] = updatedAgent;
      return of(updatedAgent).pipe(delay(500));
    }
    
    throw new Error('Agent not found');
  }

  deleteAgent(id: string): Observable<boolean> {
    // In a real app, this would call an API
    const initialLength = this.mockAgents.length;
    this.mockAgents = this.mockAgents.filter(a => a.id !== id);
    return of(this.mockAgents.length < initialLength).pipe(delay(500));
  }

  getBranches(): Observable<string[]> {
    // In a real app, this would call an API to get available branches
    return of([
      'Casablanca - Main Branch',
      'Casablanca - Maarif Branch',
      'Casablanca - Ain Diab Branch',
      'Rabat - Central Branch',
      'Rabat - Agdal Branch',
      'Tangier - Port Branch',
      'Marrakech - Medina Branch',
      'Marrakech - Gueliz Branch',
      'Agadir - Beach Branch',
      'Fes - Old City Branch',
      'Meknes - Central Branch'
    ]).pipe(delay(300));
  }

  getRoles(): Observable<string[]> {
    // In a real app, this would call an API to get available roles
    return of([
      'Junior Agent',
      'Senior Agent',
      'Lead Agent',
      'Branch Supervisor'
    ]).pipe(delay(300));
  }
}