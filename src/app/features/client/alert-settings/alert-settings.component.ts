import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertSettingsService } from '../../../services/alert-settings.service';

// Interface simplifiée pour correspondre au backend
interface AlertSetting {
  id?: string;
  clientId: string;
  balanceBelow: {
    enabled: boolean;
    threshold?: number;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  largeTransaction: {
    enabled: boolean;
    threshold?: number;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  loginNewDevice: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  suspiciousActivity: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  newStatement: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  paymentDue: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  budgetExceeded: {
    enabled: boolean;
    threshold?: number;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
  savingsGoalReached: {
    enabled: boolean;
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  };
}

// Interface pour l'affichage UI
interface AlertDisplay {
  key: keyof Omit<AlertSetting, 'id' | 'clientId'>;
  label: string;
  description: string;
  icon: string;
  hasThreshold: boolean;
  thresholdLabel?: string;
  category: 'security' | 'financial' | 'informational';
}

@Component({
  selector: 'app-alert-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alert-settings.component.html',
  styleUrls: ['./alert-settings.component.css']
})
export class AlertSettingsComponent implements OnInit {
  alertSettings: AlertSetting | null = null;
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';
  
  private clientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';

  // Configuration des alertes pour l'affichage
  alertDisplayConfig: AlertDisplay[] = [
    {
      key: 'balanceBelow',
      label: 'Solde faible',
      description: 'Être alerté quand le solde descend en dessous d\'un seuil',
      icon: 'fa-wallet',
      hasThreshold: true,
      thresholdLabel: 'Seuil minimal (MAD)',
      category: 'financial'
    },
    {
      key: 'largeTransaction',
      label: 'Transaction importante',
      description: 'Être alerté pour les transactions dépassant un montant',
      icon: 'fa-money-bill-wave',
      hasThreshold: true,
      thresholdLabel: 'Montant à partir de (MAD)',
      category: 'financial'
    },
    {
      key: 'loginNewDevice',
      label: 'Connexion nouveau dispositif',
      description: 'Être alerté lors d\'une connexion depuis un nouvel appareil',
      icon: 'fa-laptop',
      hasThreshold: false,
      category: 'security'
    },
    {
      key: 'suspiciousActivity',
      label: 'Activité suspecte',
      description: 'Être alerté en cas d\'activité suspecte détectée',
      icon: 'fa-shield-alt',
      hasThreshold: false,
      category: 'security'
    },
    {
      key: 'newStatement',
      label: 'Nouveau relevé',
      description: 'Être alerté quand un nouveau relevé est disponible',
      icon: 'fa-file-invoice',
      hasThreshold: false,
      category: 'informational'
    },
    {
      key: 'paymentDue',
      label: 'Échéance de paiement',
      description: 'Être alerté pour les échéances de paiement',
      icon: 'fa-calendar-check',
      hasThreshold: false,
      category: 'financial'
    },
    {
      key: 'budgetExceeded',
      label: 'Budget dépassé',
      description: 'Être alerté quand un pourcentage du budget est atteint',
      icon: 'fa-chart-line',
      hasThreshold: true,
      thresholdLabel: 'Pourcentage d\'alerte (%)',
      category: 'financial'
    },
    {
      key: 'savingsGoalReached',
      label: 'Objectif d\'épargne atteint',
      description: 'Être alerté quand un objectif d\'épargne est atteint',
      icon: 'fa-piggy-bank',
      hasThreshold: false,
      category: 'financial'
    }
  ];

  constructor(private alertSettingsService: AlertSettingsService) {}

  ngOnInit(): void {
    this.loadAlertSettings();
  }

  /**
   * Charger les paramètres d'alerte
   */
  loadAlertSettings(): void {
    this.isLoading = true;
    this.error = '';
    
    this.alertSettingsService.getClientAlertSettings(this.clientId).subscribe({
      next: (settings) => {
        if (settings) {
          this.alertSettings = settings;
        } else {
          // Créer des paramètres par défaut
          this.alertSettings = this.createDefaultSettings();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading alert settings:', error);
        this.error = 'Impossible de charger vos paramètres d\'alerte.';
        this.alertSettings = this.createDefaultSettings();
        this.isLoading = false;
      }
    });
  }

  /**
   * Créer des paramètres par défaut
   */
  createDefaultSettings(): AlertSetting {
    const defaultChannels = { email: true, sms: false, push: true };
    
    return {
      clientId: this.clientId,
      balanceBelow: { enabled: false, threshold: 1000, channels: { ...defaultChannels } },
      largeTransaction: { enabled: true, threshold: 5000, channels: { ...defaultChannels } },
      loginNewDevice: { enabled: true, channels: { ...defaultChannels } },
      suspiciousActivity: { enabled: true, channels: { ...defaultChannels } },
      newStatement: { enabled: false, channels: { email: true, sms: false, push: false } },
      paymentDue: { enabled: true, channels: { ...defaultChannels } },
      budgetExceeded: { enabled: true, threshold: 80, channels: { ...defaultChannels } },
      savingsGoalReached: { enabled: true, channels: { ...defaultChannels } }
    };
  }

  /**
   * Basculer l'activation d'une alerte
   */
  toggleAlert(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>): void {
    if (!this.alertSettings) return;
    
    this.alertSettings[alertKey].enabled = !this.alertSettings[alertKey].enabled;
    this.saveSettings();
  }

  /**
   * Mettre à jour le seuil
   */
  updateThreshold(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>, value: number): void {
    if (!this.alertSettings) return;
    
    const alertRule = this.alertSettings[alertKey] as any;
    if (alertRule && 'threshold' in alertRule) {
      // Validation pour le budget (pourcentage)
      if (alertKey === 'budgetExceeded') {
        alertRule.threshold = Math.min(100, Math.max(1, value));
      } else {
        alertRule.threshold = Math.max(0, value);
      }
      this.saveSettings();
    }
  }

  /**
   * Basculer un canal de notification
   */
  toggleChannel(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>, channel: 'email' | 'sms' | 'push'): void {
    if (!this.alertSettings) return;
    
    this.alertSettings[alertKey].channels[channel] = !this.alertSettings[alertKey].channels[channel];
    this.saveSettings();
  }

  /**
   * Sauvegarder les paramètres
   */
  saveSettings(): void {
    if (!this.alertSettings || this.isSaving) return;
    
    this.isSaving = true;
    this.error = '';
    this.successMessage = '';

    this.alertSettingsService.saveAlertSettings(this.alertSettings).subscribe({
      next: (savedSettings) => {
        this.alertSettings = savedSettings;
        this.successMessage = 'Paramètres sauvegardés avec succès';
        this.isSaving = false;
        
        // Auto-masquer le message
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error saving alert settings:', error);
        this.error = 'Erreur lors de la sauvegarde des paramètres';
        this.isSaving = false;
        
        setTimeout(() => {
          this.error = '';
        }, 5000);
      }
    });
  }

  /**
   * Obtenir la valeur du seuil
   */
  getThresholdValue(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>): number {
    if (!this.alertSettings) return 0;
    
    const alertRule = this.alertSettings[alertKey] as any;
    return alertRule.threshold || 0;
  }

  /**
   * Vérifier si une alerte est activée
   */
  isAlertEnabled(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>): boolean {
    return this.alertSettings ? this.alertSettings[alertKey].enabled : false;
  }

  /**
   * Vérifier si un canal est activé
   */
  isChannelEnabled(alertKey: keyof Omit<AlertSetting, 'id' | 'clientId'>, channel: 'email' | 'sms' | 'push'): boolean {
    return this.alertSettings ? this.alertSettings[alertKey].channels[channel] : false;
  }

  /**
   * Grouper les alertes par catégorie
   */
  getAlertsByCategory(): { [key: string]: AlertDisplay[] } {
    return this.alertDisplayConfig.reduce((groups, alert) => {
      if (!groups[alert.category]) {
        groups[alert.category] = [];
      }
      groups[alert.category].push(alert);
      return groups;
    }, {} as { [key: string]: AlertDisplay[] });
  }

  /**
   * Obtenir le nom de la catégorie
   */
  getCategoryName(category: string): string {
    switch (category) {
      case 'security': return 'Sécurité';
      case 'financial': return 'Financières';
      case 'informational': return 'Informatives';
      default: return category;
    }
  }

  /**
   * Obtenir la couleur de la catégorie
   */
  getCategoryColor(category: string): string {
    switch (category) {
      case 'security': return 'bg-red-100 text-red-800';
      case 'financial': return 'bg-blue-100 text-blue-800';
      case 'informational': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}