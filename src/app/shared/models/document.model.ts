export type DocumentType = 'statement' | 'receipt' | 'contract' | 'tax' | 'other';

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  fileUrl: string;
  fileSize: number;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  userId?: string;
  accountId?: string;
}

export interface DocumentFilter {
  type?: DocumentType;
  isRead?: boolean;
  isArchived?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}