import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Announcement , AnnouncementCategory , AnnouncementFilter } from '../../../shared/models/Announcement.model';
import { AnnouncementService } from '../../../services/announcement/announcement.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit {
  announcements: Announcement[] = [];
  filteredAnnouncements: Announcement[] = [];
  selectedAnnouncement: Announcement | null = null;
  showAnnouncementDetails = false;
  
  isLoading = true;
  error = '';
  
  categories: AnnouncementCategory[] = [
    'general', 'security', 'maintenance', 'new_feature', 'promotion', 'event'
  ];
  
  filter: AnnouncementFilter = {};

  constructor(private announcementService: AnnouncementService) { }

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoading = true;
    this.error = '';
    
    this.announcementService.getAnnouncements().subscribe({
      next: (data) => {
        this.announcements = data;
        this.filteredAnnouncements = [...data];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading announcements', error);
        this.error = 'Impossible de charger les annonces. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    // Filtrage local pour le développement
    this.filteredAnnouncements = this.announcements.filter(announcement => {
      // Category filter
      if (this.filter.category && announcement.category !== this.filter.category) {
        return false;
      }
      
      // Important filter
      if (this.filter.isImportant !== undefined && announcement.isImportant !== this.filter.isImportant) {
        return false;
      }
      
      // Date range filter
      if (this.filter.startDate && new Date(announcement.date) < new Date(this.filter.startDate)) {
        return false;
      }
      
      if (this.filter.endDate && new Date(announcement.date) > new Date(this.filter.endDate)) {
        return false;
      }
      
      // Search filter
      if (this.filter.search && 
          !announcement.title.toLowerCase().includes(this.filter.search.toLowerCase()) && 
          !announcement.content.toLowerCase().includes(this.filter.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  resetFilters(): void {
    this.filter = {};
    this.filteredAnnouncements = [...this.announcements];
  }

  viewAnnouncementDetails(announcement: Announcement): void {
    this.selectedAnnouncement = announcement;
    this.showAnnouncementDetails = true;
    
    // Marquer l'annonce comme lue
    this.announcementService.markAsRead(announcement.id).subscribe();
  }

  closeAnnouncementDetails(): void {
    this.showAnnouncementDetails = false;
    this.selectedAnnouncement = null;
  }

  getCategoryIcon(category: AnnouncementCategory): string {
    switch(category) {
      case 'security': return 'fa-shield-alt';
      case 'maintenance': return 'fa-tools';
      case 'new_feature': return 'fa-sparkles';
      case 'promotion': return 'fa-tag';
      case 'event': return 'fa-calendar';
      default: return 'fa-bullhorn';
    }
  }

  getCategoryLabel(category: AnnouncementCategory): string {
    switch(category) {
      case 'security': return 'Sécurité';
      case 'maintenance': return 'Maintenance';
      case 'new_feature': return 'Nouvelle fonctionnalité';
      case 'promotion': return 'Promotion';
      case 'event': return 'Événement';
      default: return 'Général';
    }
  }

  getCategoryColor(category: AnnouncementCategory): string {
    switch(category) {
      case 'security': return 'blue';
      case 'maintenance': return 'orange';
      case 'new_feature': return 'green';
      case 'promotion': return 'purple';
      case 'event': return 'pink';
      default: return 'gray';
    }
  }
}