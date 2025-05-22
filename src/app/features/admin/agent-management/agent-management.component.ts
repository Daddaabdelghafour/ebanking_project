import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgentService } from '../../../services/agent/agent.service';
import { Agent, AgentFormData } from '../../../shared/models/agent.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-agent-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './agent-management.component.html',
  styleUrls: ['./agent-management.component.css'],
  providers: [AgentService]
})
export class AgentManagementComponent implements OnInit {
  // Agents data
  agents: Agent[] = [];
  branches: string[] = [];
  roles: string[] = [];
  Math = Math;

  // UI state
  isLoading = true;
  error: string | null = null;
  showModal = false;
  isEditing = false;
  isDeleting = false;
  isDebugMode = false; // Nouvelle propriété pour le mode debug
  apiResponse: any = null; // Pour stocker la réponse de l'API

  // Agent sélectionné pour modification ou suppression
  selectedAgent: Agent | null = null;

  // Formulaire
  agentForm: FormGroup;
  
  // Filtre et pagination
  statusFilter: 'all' | 'active' | 'inactive' | 'pending' = 'all';
  filterText: string = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Tri
  sortField: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private fb: FormBuilder,
    private agentService: AgentService
  ) {
    this.agentForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      employeeId: ['', [Validators.required]],
      branch: ['', [Validators.required]],
      role: ['', [Validators.required]],
      status: ['active', [Validators.required]],
      password: ['', [
        Validators.minLength(8),
        // Only required when creating a new agent
        (control: import('@angular/forms').AbstractControl) => !this.isEditing && !control.value ? { required: true } : null
      ]],
      confirmPassword: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadAgents();
    this.loadBranches();
    this.loadRoles();
  }

  // Chargement des données
  loadAgents(): void {
    this.isLoading = true;
    this.error = null;

    this.agentService.getAgents()
      .pipe(
        catchError(error => {
          this.error = "Impossible de charger la liste des agents: " + error.message;
          console.error("Erreur lors du chargement des agents:", error);
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(agents => {
        this.agents = agents;
        this.updatePagination();
      });
  }

  loadBranches(): void {
    this.agentService.getBranches().subscribe(branches => {
      this.branches = branches;
    });
  }
  
logAgents(): void {
  console.log('Current agents:', this.agents);
  
  if (this.isDebugMode) {
    this.apiResponse = {
      status: 'info',
      action: 'log',
      data: this.agents
    };
  }
}
  loadRoles(): void {
    this.agentService.getRoles().subscribe(roles => {
      this.roles = roles;
    });
  }

  // Actions sur les agents
  openAddModal(): void {
    this.isEditing = false;
    this.selectedAgent = null;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(agent: Agent): void {
    this.isEditing = true;
    this.selectedAgent = agent;
    this.populateForm(agent);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  confirmDeleteAgent(agent: Agent): void {
    this.selectedAgent = agent;
    this.isDeleting = true;
  }

  cancelDelete(): void {
    this.isDeleting = false;
    this.selectedAgent = null;
  }

  // Dans la méthode saveAgent, modifiez légèrement la gestion des erreurs :
saveAgent(): void {
  if (this.agentForm.invalid) {
    this.markFormGroupTouched(this.agentForm);
    return;
  }

  const formData: AgentFormData = this.agentForm.value;
  this.isLoading = true;
  
  if (this.isDebugMode) {
    console.log('Form data to be sent:', formData);
    this.apiResponse = { status: 'pending', data: formData };
  }

  if (this.isEditing && this.selectedAgent) {
    this.agentService.updateAgent(this.selectedAgent.id, formData)
      .subscribe({
        next: (response) => {
          if (this.isDebugMode) {
            console.log('Update response:', response);
            this.apiResponse = { 
              status: 'success', 
              data: response,
              request: formData,
              action: 'update'
            };
          }
          this.loadAgents();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = "Erreur lors de la mise à jour: " + error.message;
          if (this.isDebugMode) {
            console.error('Update error details:', error);
            this.apiResponse = { 
              status: 'error', 
              error: error,
              request: formData,
              action: 'update'
            };
          }
          this.isLoading = false;
        }
      });
  } else {
    this.agentService.createAgent(formData)
      .subscribe({
        next: (response) => {
          if (this.isDebugMode) {
            console.log('Create response:', response);
            this.apiResponse = { 
              status: 'success', 
              data: response,
              request: formData,
              action: 'create'
            };
          }
          this.loadAgents();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = "Erreur lors de l'ajout: " + error.message;
          if (this.isDebugMode) {
            console.error('Create error details:', error);
            this.apiResponse = { 
              status: 'error', 
              error: error,
              request: formData,
              action: 'create'
            };
          }
          this.isLoading = false;
        }
      });
  }
}

  deleteAgent(): void {
    if (!this.selectedAgent) return;

    this.isLoading = true;
    this.agentService.deleteAgent(this.selectedAgent.id)
      .pipe(
        catchError(error => {
          this.error = "Erreur lors de la suppression: " + error.message;
          
          // Debug information
          if (this.isDebugMode) {
            console.error('Delete error details:', error);
            this.apiResponse = { 
              status: 'error', 
              error: error,
              agentId: this.selectedAgent?.id,
              action: 'delete'
            };
          }
          
          return of(false);
        }),
        finalize(() => {
          this.isLoading = false;
          this.isDeleting = false;
        })
      )
      .subscribe(success => {
        if (success) {
          // Debug information
          if (this.isDebugMode) {
            this.apiResponse = { 
              status: 'success', 
              agentId: this.selectedAgent?.id,
              action: 'delete'
            };
          }
          
          this.loadAgents();
        }
      });
  }

  // Utilitaires pour les formulaires
  resetForm(): void {
    this.agentForm.reset({
      status: 'active'
    });
  }

  populateForm(agent: Agent): void {
    this.agentForm.patchValue({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      employeeId: agent.employeeId,
      branch: agent.branch,
      role: agent.role,
      status: agent.status,
      password: '',
      confirmPassword: ''
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  passwordMatchValidator(group: FormGroup): null | { mismatch: boolean } {
    const passwordControl = group.get('password');
    const confirmPasswordControl = group.get('confirmPassword');
    
    // Si un des champs est vide ou le formulaire est en mode édition sans changement de mot de passe
    if (!passwordControl?.value && !confirmPasswordControl?.value) {
      return null;
    }
    
    if (passwordControl?.value !== confirmPasswordControl?.value) {
      return { mismatch: true };
    }
    
    return null;
  }

  showValidationError(controlName: string): boolean {
    const control = this.agentForm.get(controlName);
    return control ? (control.touched || control.dirty) && control.invalid : false;
  }

  getPasswordMismatchError(): boolean {
    return this.agentForm.hasError('mismatch');
  }

  // Filtrage, tri et pagination
  getFilteredAgents(): Agent[] {
    let filteredAgents = [...this.agents];
    
    // Appliquer le filtre de statut
    if (this.statusFilter !== 'all') {
      filteredAgents = filteredAgents.filter(agent => agent.status === this.statusFilter);
    }
    
    // Appliquer le filtre de texte
    if (this.filterText) {
      const searchTerm = this.filterText.toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.firstName.toLowerCase().includes(searchTerm) ||
        agent.lastName.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm) ||
        agent.employeeId.toLowerCase().includes(searchTerm) ||
        agent.branch.toLowerCase().includes(searchTerm) ||
        agent.role.toLowerCase().includes(searchTerm)
      );
    }
    
    // Appliquer le tri
    filteredAgents.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (this.sortField) {
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'branch':
          valueA = a.branch.toLowerCase();
          valueB = b.branch.toLowerCase();
          break;
        case 'role':
          valueA = a.role.toLowerCase();
          valueB = b.role.toLowerCase();
          break;
        case 'status':
          valueA = a.status.toLowerCase();
          valueB = b.status.toLowerCase();
          break;
        case 'dateJoined':
          valueA = new Date(a.dateJoined).getTime();
          valueB = new Date(b.dateJoined).getTime();
          break;
        default:
          valueA = a.lastName.toLowerCase();
          valueB = b.lastName.toLowerCase();
      }
      
      const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return filteredAgents;
  }

  getPaginatedAgents(): Agent[] {
    const filteredAgents = this.getFilteredAgents();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + this.itemsPerPage);
  }

  updatePagination(): void {
    const filteredAgents = this.getFilteredAgents();
    this.totalPages = Math.ceil(filteredAgents.length / this.itemsPerPage);
    // Assurer que la page courante est valide
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  filterByStatus(status: 'all' | 'active' | 'inactive' | 'pending'): void {
    this.statusFilter = status;
    this.currentPage = 1; // Retour à la première page
    this.updatePagination();
  }

  sortAgents(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.updatePagination();
  }

  getSortIcon(field: string): string {
    if (this.sortField === field) {
      return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Utilitaires divers
  getFullName(agent: Agent): string {
    return `${agent.firstName} ${agent.lastName}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Fonctions de débogage
  toggleDebugMode(): void {
    this.isDebugMode = !this.isDebugMode;
    if (!this.isDebugMode) {
      this.apiResponse = null;
    }
  }
}