// À placer dans: c:\Users\dadda\Desktop\Ebanking_Project\e-banking-app\src\app\shared\models\task.model.ts

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory = 'verification' | 'approval' | 'customer_service' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  client_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: Date;
  due_date: Date;
  assigned_to: string;
  category: TaskCategory;
}

export interface TaskFilter {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  category?: TaskCategory | 'all';
  searchTerm?: string;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}