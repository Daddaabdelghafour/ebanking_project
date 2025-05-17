export interface Document {
  id: string;
  userId: string;
  accountId?: string;
  type: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

export type DocumentType = 'statement' | 'receipt' | 'contract' | 'tax' | 'other';

export interface DocumentFilter {
  type?: DocumentType;
  startDate?: Date;
  endDate?: Date;
  isRead?: boolean;
  isArchived?: boolean;
  searchTerm?: string;
}

export interface DocumentSummary {
  totalDocuments: number;
  unreadCount: number;
  documentsByType: {
    type: DocumentType;
    count: number;
  }[];
  recentDocuments: Document[];
}

// Interface pour la réponse d'upload de document
export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  error?: string;
}

// Interface pour le formulaire d'upload de document
export interface DocumentUploadForm {
  title: string;
  description?: string;
  type: DocumentType;
  accountId?: string;
  file: File;
  periodStart?: Date;
  periodEnd?: Date;
}