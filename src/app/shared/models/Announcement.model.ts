export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  author: string;
  isImportant: boolean;
  category: AnnouncementCategory;
  createdAt: Date;
  updatedAt?: Date;
}

export type AnnouncementCategory = 
  | 'security' 
  | 'maintenance' 
  | 'new_feature' 
  | 'promotion' 
  | 'event'
  | 'general';

export interface AnnouncementFilter {
  category?: AnnouncementCategory;
  startDate?: Date;
  endDate?: Date;
  isImportant?: boolean;
  search?: string;
}