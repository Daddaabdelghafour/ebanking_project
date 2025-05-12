import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AgentService } from '../../../services/agent/agent.service';
import { Agent, AgentFormData } from '../../../shared/models/agent.model';

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
  selectedAgent: Agent | null = null;
  
  // Form
  agentForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  
  // Filter & Sort
  filterText = '';
  sortBy = 'dateJoined';
  sortOrder: 'asc' | 'desc' = 'desc';
  statusFilter: 'all' | 'active' | 'inactive' | 'pending' = 'all';
  
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

  loadAgents(): void {
    this.isLoading = true;
    this.error = null;
    
    this.agentService.getAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger les agents. Veuillez réessayer.';
        this.isLoading = false;
        console.error('Error loading agents:', err);
      }
    });
  }

  loadBranches(): void {
    this.agentService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (err) => {
        console.error('Error loading branches:', err);
      }
    });
  }

  loadRoles(): void {
    this.agentService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedAgent = null;
    this.agentForm.reset({
      status: 'active'
    });
    this.showModal = true;
  }

  openEditModal(agent: Agent): void {
    this.isEditing = true;
    this.selectedAgent = agent;
    
    this.agentForm.patchValue({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      employeeId: agent.employeeId,
      branch: agent.branch,
      role: agent.role,
      status: agent.status
    });
    
    // Remove validators for password fields when editing
    const passwordControl = this.agentForm.get('password');
    const confirmPasswordControl = this.agentForm.get('confirmPassword');
    
    if (passwordControl && confirmPasswordControl) {
      passwordControl.clearValidators();
      passwordControl.updateValueAndValidity();
      confirmPasswordControl.clearValidators();
      confirmPasswordControl.updateValueAndValidity();
    }
    
    this.showModal = true;
  }

  confirmDeleteAgent(agent: Agent): void {
    this.selectedAgent = agent;
    this.isDeleting = true;
  }

  cancelDelete(): void {
    this.isDeleting = false;
    this.selectedAgent = null;
  }

  deleteAgent(): void {
    if (!this.selectedAgent) return;
    
    this.isLoading = true;
    
    this.agentService.deleteAgent(this.selectedAgent.id).subscribe({
      next: (success) => {
        if (success) {
          this.loadAgents();
          this.cancelDelete();
        } else {
          this.error = "Impossible de supprimer l'agent. Veuillez réessayer.";
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = "Une erreur s'est produite lors de la suppression de l'agent.";
        this.isLoading = false;
        console.error('Error deleting agent:', err);
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.agentForm.reset();
  }

  saveAgent(): void {
    if (this.agentForm.invalid) return;
    
    const agentData: AgentFormData = this.agentForm.value;
    this.isLoading = true;
    
    if (this.isEditing && this.selectedAgent) {
      this.agentService.updateAgent(this.selectedAgent.id, agentData).subscribe({
        next: () => {
          this.loadAgents();
          this.closeModal();
        },
        error: (err) => {
          this.error = "Impossible de mettre à jour l'agent. Veuillez réessayer.";
          this.isLoading = false;
          console.error('Error updating agent:', err);
        }
      });
    } else {
      this.agentService.createAgent(agentData).subscribe({
        next: () => {
          this.loadAgents();
          this.closeModal();
        },
        error: (err) => {
          this.error = "Impossible de créer l'agent. Veuillez réessayer.";
          this.isLoading = false;
          console.error('Error creating agent:', err);
        }
      });
    }
  }

  // Helper methods
  passwordMatchValidator(group: FormGroup): null | { passwordMismatch: true } {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
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

  getFullName(agent: Agent): string {
    return `${agent.firstName} ${agent.lastName}`;
  }

  showValidationError(controlName: string): boolean {
    const control = this.agentForm.get(controlName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  getPasswordMismatchError(): boolean {
    return !!this.agentForm.hasError('passwordMismatch') && 
           !!this.agentForm.get('password')?.dirty &&
           !!this.agentForm.get('confirmPassword')?.dirty;
  }
  
  sortAgents(property: string): void {
    if (this.sortBy === property) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = property;
      this.sortOrder = 'asc';
    }
  }
  
  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'fa-sort';
    return this.sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }
  
  filterByStatus(status: 'all' | 'active' | 'inactive' | 'pending'): void {
    this.statusFilter = status;
    this.currentPage = 1;
  }
  
  getFilteredAgents(): Agent[] {
    let filtered = [...this.agents];
    
    // Apply text filter
    if (this.filterText) {
      const searchTerm = this.filterText.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.firstName.toLowerCase().includes(searchTerm) ||
        agent.lastName.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm) ||
        agent.employeeId.toLowerCase().includes(searchTerm) ||
        agent.branch.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(agent => agent.status === this.statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case 'branch':
          comparison = a.branch.localeCompare(b.branch);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'dateJoined':
          comparison = new Date(a.dateJoined).getTime() - new Date(b.dateJoined).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }
  
  getPaginatedAgents(): Agent[] {
    const filtered = this.getFilteredAgents();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.getFilteredAgents().length / this.itemsPerPage);
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}