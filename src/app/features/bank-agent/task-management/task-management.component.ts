
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../../shared/models/task.model';
import { TaskService } from '../../../services/task/task.service';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  // Tâches
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  
  // Formulaire
  taskForm: FormGroup;
  isEditMode = false;
  currentTaskId: string | null = null;
  
  // Filtres
  statusFilter: string = 'all';
  priorityFilter: string = 'all';
  categoryFilter: string = 'all';
  searchTerm: string = '';
  
  // Modal
  showTaskModal = false;
  
  // Options pour les listes déroulantes
  priorities: TaskPriority[] = ['high', 'medium', 'low'];
  statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
  categories: TaskCategory[] = ['verification', 'approval', 'customer_service', 'other'];
  
  constructor(
    private fb: FormBuilder,
    private taskService: TaskService
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      client_id: ['', [Validators.required]],
      priority: ['medium', [Validators.required]],
      status: ['pending', [Validators.required]],
      due_date: ['', [Validators.required]],
      assigned_to: ['', [Validators.required]],
      category: ['other', [Validators.required]],
    });
  }
  
  ngOnInit(): void {
    this.loadTasks();
  }
  
  loadTasks(): void {
    // En production, utiliser le service
    // this.taskService.getTasks().subscribe(tasks => {
    //   this.allTasks = tasks;
    //   this.applyFilters();
    // });
    
    // Pour le développement, utiliser des données fictives
    this.allTasks = [
      {
        id: 'TSK001',
        title: 'Vérification KYC',
        description: 'Vérifier les documents d\'identité du client',
        client_id: 'CLT123',
        priority: 'high',
        status: 'pending',
        created_at: new Date(2023, 4, 14),
        due_date: new Date(2023, 4, 15),
        assigned_to: 'AGT001',
        category: 'verification'
      },
      // Autres tâches...
    ];
    this.applyFilters();
  }
  
  applyFilters(): void {
    this.filteredTasks = this.allTasks.filter(task => {
      // Filtrer par statut
      if (this.statusFilter !== 'all' && task.status !== this.statusFilter) {
        return false;
      }
      
      // Filtrer par priorité
      if (this.priorityFilter !== 'all' && task.priority !== this.priorityFilter) {
        return false;
      }
      
      // Filtrer par catégorie
      if (this.categoryFilter !== 'all' && task.category !== this.categoryFilter) {
        return false;
      }
      
      // Filtrer par terme de recherche
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return task.title.toLowerCase().includes(term) || 
               task.description.toLowerCase().includes(term);
      }
      
      return true;
    });
  }
  
  openNewTaskModal(): void {
    this.isEditMode = false;
    this.currentTaskId = null;
    this.taskForm.reset({
      priority: 'medium',
      status: 'pending',
      category: 'other',
      due_date: this.formatDate(new Date(Date.now() + 86400000)) // Demain
    });
    this.showTaskModal = true;
  }
  
  openEditTaskModal(task: Task): void {
    this.isEditMode = true;
    this.currentTaskId = task.id;
    this.taskForm.setValue({
      title: task.title,
      description: task.description,
      client_id: task.client_id,
      priority: task.priority,
      status: task.status,
      due_date: this.formatDate(task.due_date),
      assigned_to: task.assigned_to,
      category: task.category
    });
    this.showTaskModal = true;
  }
  
  closeTaskModal(): void {
    this.showTaskModal = false;
  }
  
  submitTaskForm(): void {
    if (this.taskForm.invalid) {
      return;
    }
    
    const formValues = this.taskForm.value;
    
    if (this.isEditMode && this.currentTaskId) {
      // Mettre à jour une tâche existante
      const updatedTask: Partial<Task> = {
        ...formValues,
        due_date: new Date(formValues.due_date)
      };
      
      // En production, utiliser le service
      // this.taskService.updateTask(this.currentTaskId, updatedTask).subscribe(
      //   (task) => {
      //     const index = this.allTasks.findIndex(t => t.id === this.currentTaskId);
      //     this.allTasks[index] = task;
      //     this.applyFilters();
      //     this.closeTaskModal();
      //   },
      //   (error) => console.error('Error updating task:', error)
      // );
      
      // Pour le développement
      const index = this.allTasks.findIndex(t => t.id === this.currentTaskId);
      if (index !== -1) {
        this.allTasks[index] = {
          ...this.allTasks[index],
          ...updatedTask
        };
        this.applyFilters();
        this.closeTaskModal();
      }
    } else {
      // Créer une nouvelle tâche
      const newTask: Omit<Task, 'id' | 'created_at'> = {
        ...formValues,
        due_date: new Date(formValues.due_date)
      };
      
      // En production, utiliser le service
      // this.taskService.createTask(newTask).subscribe(
      //   (task) => {
      //     this.allTasks.push(task);
      //     this.applyFilters();
      //     this.closeTaskModal();
      //   },
      //   (error) => console.error('Error creating task:', error)
      // );
      
      // Pour le développement
      const mockNewTask: Task = {
        ...newTask,
        id: `TSK${Math.floor(Math.random() * 10000)}`,
        created_at: new Date()
      };
      this.allTasks.push(mockNewTask);
      this.applyFilters();
      this.closeTaskModal();
    }
  }
  
  deleteTask(taskId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      // En production, utiliser le service
      // this.taskService.deleteTask(taskId).subscribe(
      //   () => {
      //     this.allTasks = this.allTasks.filter(t => t.id !== taskId);
      //     this.applyFilters();
      //   },
      //   (error) => console.error('Error deleting task:', error)
      // );
      
      // Pour le développement
      this.allTasks = this.allTasks.filter(t => t.id !== taskId);
      this.applyFilters();
    }
  }
  
  updateTaskStatus(taskId: string, status: TaskStatus): void {
    // En production, utiliser le service
    // this.taskService.updateTaskStatus(taskId, status).subscribe(
    //   (updatedTask) => {
    //     const index = this.allTasks.findIndex(t => t.id === taskId);
    //     this.allTasks[index] = updatedTask;
    //     this.applyFilters();
    //   },
    //   (error) => console.error('Error updating task status:', error)
    // );
    
    // Pour le développement
    const index = this.allTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.allTasks[index].status = status;
      this.applyFilters();
    }
  }
  
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}