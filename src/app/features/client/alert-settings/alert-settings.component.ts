import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertSettings , AlertPreference , AlertType } from '../../../shared/models/alert.model';
import { AlertSettingsService } from '../../../services/alert-settings.service';

@Component({
  selector: 'app-alert-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alert-settings.component.html',
  styleUrls: ['./alert-settings.component.css']
})
export class AlertSettingsComponent implements OnInit {
  alertSettings!: AlertSettings;
  alertPreferences: AlertPreference[] = [];
  
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  constructor(private alertSettingsService: AlertSettingsService) { }

  ngOnInit(): void {
    this.loadAlertSettings();
  }

  loadAlertSettings(): void {
    this.isLoading = true;
    this.error = '';
    
    this.alertSettingsService.getAlertPreferences().subscribe({
      next: (data) => {
        this.alertPreferences = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading alert settings', error);
        this.error = 'Impossible de charger vos paramètres d\'alerte. Veuillez réessayer plus tard.';
        this.isLoading = false;
      }
    });
  }

  toggleAlertEnabled(preference: AlertPreference): void {
    this.isSaving = true;
    this.successMessage = '';
    this.error = '';
    
    const enabled = !preference.enabled;
    
    this.alertSettingsService.toggleAlertType(preference.type, enabled).subscribe({
      next: () => {
        // Mise à jour locale pour l'interface utilisateur
        preference.enabled = enabled;
        this.successMessage = `Alerte ${enabled ? 'activée' : 'désactivée'}`;
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling alert', error);
        this.error = 'Erreur lors de la modification de l\'alerte';
        this.isSaving = false;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  updateThreshold(preference: AlertPreference): void {
    if (!preference.threshold) return;
    
    this.isSaving = true;
    this.successMessage = '';
    this.error = '';
    
    this.alertSettingsService.updateAlertThreshold(preference.type, preference.threshold).subscribe({
      next: () => {
        this.successMessage = 'Seuil d\'alerte mis à jour';
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating threshold', error);
        this.error = 'Erreur lors de la mise à jour du seuil';
        this.isSaving = false;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  toggleChannel(preference: AlertPreference, channel: keyof AlertPreference['channels']): void {
    preference.channels[channel] = !preference.channels[channel];
    
    this.isSaving = true;
    this.successMessage = '';
    this.error = '';
    
    this.alertSettingsService.updateAlertChannels(
      preference.type,
      preference.channels.email,
      preference.channels.sms,
      preference.channels.push
    ).subscribe({
      next: () => {
        this.successMessage = 'Canaux de notification mis à jour';
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating channels', error);
        this.error = 'Erreur lors de la mise à jour des canaux';
        this.isSaving = false;
        setTimeout(() => this.error = '', 3000);
        // Rétablir l'état précédent en cas d'erreur
        preference.channels[channel] = !preference.channels[channel];
      }
    });
  }
  
  getAlertIcon(type: AlertType): string {
    switch (type) {
      case 'balance_below': return 'fa-wallet';
      case 'large_transaction': return 'fa-money-bill-wave';
      case 'login_new_device': return 'fa-laptop';
      case 'suspicious_activity': return 'fa-shield-alt';
      case 'new_statement': return 'fa-file-invoice';
      case 'payment_due': return 'fa-calendar-check';
      default: return 'fa-bell';
    }
  }
}