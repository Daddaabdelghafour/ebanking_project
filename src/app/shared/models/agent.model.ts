export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  branch: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  imageUrl?: string;
  dateJoined: Date;
  lastLogin?: Date;
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