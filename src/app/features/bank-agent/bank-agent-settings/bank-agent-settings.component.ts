import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-bank-agent-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bank-agent-settings.component.html',
  styleUrls: ['./bank-agent-settings.component.css']
})
export class BankAgentSettingsComponent implements OnInit {
  generalSettingsForm: FormGroup;
  notificationSettingsForm: FormGroup;
  securitySettingsForm: FormGroup;
  activeTab = 'general';
  showSaveSuccess = false;
  
  // Theme options
  themes = [
    { id: 'system', name: 'Système' },
    { id: 'light', name: 'Clair' },
    { id: 'dark', name: 'Sombre' }
  ];
  
  // Language options
  languages = [
    { id: 'fr', name: 'Français' },
    { id: 'ar', name: 'العربية' },
    { id: 'en', name: 'English' }
  ];

  constructor(private fb: FormBuilder) {
    this.generalSettingsForm = this.fb.group({
      language: ['fr'],
      theme: ['system'],
      dashboardLayout: ['compact'],
      defaultView: ['transactions']
    });

    this.notificationSettingsForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      pushNotifications: [true],
      newClientNotify: [true],
      transactionNotify: [true],
      systemNotify: [true],
      dailyDigest: [false]
    });

    this.securitySettingsForm = this.fb.group({
      twoFactorAuth: [true],
      sessionTimeout: ['30'],
      requirePinForActions: [true],
      biometricLogin: [false]
    });
  }

  ngOnInit(): void {
    // Load user settings (would fetch from server in real app)
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  saveGeneralSettings(): void {
    console.log('Saving general settings:', this.generalSettingsForm.value);
    this.showSaveSuccessMessage();
  }

  saveNotificationSettings(): void {
    console.log('Saving notification settings:', this.notificationSettingsForm.value);
    this.showSaveSuccessMessage();
  }

  saveSecuritySettings(): void {
    console.log('Saving security settings:', this.securitySettingsForm.value);
    this.showSaveSuccessMessage();
  }

  showSaveSuccessMessage(): void {
    this.showSaveSuccess = true;
    setTimeout(() => {
      this.showSaveSuccess = false;
    }, 3000);
  }

  resetSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      this.generalSettingsForm.reset({
        language: 'fr',
        theme: 'system',
        dashboardLayout: 'compact',
        defaultView: 'transactions'
      });
      
      this.notificationSettingsForm.reset({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        newClientNotify: true,
        transactionNotify: true,
        systemNotify: true,
        dailyDigest: false
      });
      
      this.securitySettingsForm.reset({
        twoFactorAuth: true,
        sessionTimeout: '30',
        requirePinForActions: true,
        biometricLogin: false
      });
    }
  }
}