export interface Agent {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  dateJoined: string;
  lastLogin?: string | null;
  isActive: boolean;
  userId?: string | null;
}

export interface AgentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  branch: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  password?: string;
  confirmPassword?: string;
}