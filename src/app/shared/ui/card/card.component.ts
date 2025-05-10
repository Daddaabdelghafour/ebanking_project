import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() cardNumber: string = '•••• •••• •••• 4242';
  @Input() cardHolder: string = 'Card Holder';
  @Input() expiryDate: string = '12/28';
  @Input() cardType: string = 'visa'; // 'visa', 'mastercard', 'amex'
  @Input() cardBackground: string = 'bg-gradient-to-r from-blue-600 to-blue-800';
  @Input() balance: number = 0;
  @Input() currency: string = 'EUR';
  
  // Only show last 4 digits of card
  get maskedCardNumber(): string {
    if (this.cardNumber.includes('••••')) {
      return this.cardNumber;
    }
    const lastFourDigits = this.cardNumber.slice(-4);
    return `•••• •••• •••• ${lastFourDigits}`;
  }
  
  get cardLogo(): string {
  switch (this.cardType?.toLowerCase()) {
    case 'mastercard':
      return 'https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png';
    case 'amex':
    case 'american express':
      return 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_(2018).svg';
    case 'visa':
    default:
      return 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg';
  }
}

  
  // Format the balance with proper currency
  formatBalance(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.currency
    }).format(amount);
  }
}