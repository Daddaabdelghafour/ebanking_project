import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  notifications = [
    { id: 1, message: 'Dépôt confirmé', time: '2 minutes ago' },
    { id: 2, message: 'Nouveau relevé disponible', time: '1 heure ago' },
    { id: 3, message: 'Offre promotionnelle disponible', time: '1 jour ago' }
  ];

  userMenuOpen = false;
  notificationsOpen = false;

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.notificationsOpen = false;
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.userMenuOpen = false;
  }

  closeDropdowns(): void {
    this.userMenuOpen = false;
    this.notificationsOpen = false;
  }
}