// À placer dans: c:\Users\dadda\Desktop\Ebanking_Project\e-banking-app\src\app\shared\services\task.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Task , TaskFilter } from '../../shared/models/task.model';
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `/tasks`;

  constructor(private http: HttpClient) {}

  // Get all tasks with optional filters
  getTasks(filters?: TaskFilter): Observable<Task[]> {
    // Implémenter la logique de filtrage en production
    // Pour le moment, on retourne des données fictives
    return this.http.get<Task[]>(this.apiUrl);
  }

  // Get a single task by ID
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  // Create a new task
  createTask(task: Omit<Task, 'id' | 'created_at'>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  // Update an existing task
  updateTask(id: string, taskUpdates: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, taskUpdates);
  }

  // Delete a task
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Update task status
  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Get tasks for a specific agent
  getTasksByAgent(agentId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  // Get tasks by client
  getTasksByClient(clientId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/client/${clientId}`);
  }

  // Get tasks statistics
  getTasksStats(): Observable<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}