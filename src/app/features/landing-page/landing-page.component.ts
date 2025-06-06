import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingComponent implements OnInit {
  // Animation states
  isVisible = false;
  
  // Statistics
  stats = [
    { value: '50K+', label: 'Utilisateurs actifs', icon: 'fa-solid fa-users' },
    { value: '€2.5M+', label: 'Volume échangé', icon: 'fa-solid fa-chart-line' },
    { value: '15+', label: 'Crypto-monnaies', icon: 'fa-brands fa-bitcoin' },
    { value: '99.9%', label: 'Disponibilité', icon: 'fa-solid fa-shield-alt' }
  ];

  // Features
  features = [
    {
      icon: 'fa-solid fa-wallet',
      title: 'Portefeuille Sécurisé',
      description: 'Stockez vos crypto-monnaies en toute sécurité avec notre technologie de pointe.',
      color: 'blue'
    },
    {
      icon: 'fa-solid fa-exchange-alt',
      title: 'Trading en Temps Réel',
      description: 'Achetez et vendez des cryptos instantanément avec des prix en temps réel.',
      color: 'green'
    },
    {
      icon: 'fa-solid fa-chart-area',
      title: 'Analyses Avancées',
      description: 'Suivez vos performances avec des graphiques détaillés et des insights.',
      color: 'purple'
    },
    {
      icon: 'fa-solid fa-mobile-alt',
      title: 'Application Mobile',
      description: 'Gérez votre portefeuille où que vous soyez avec notre app mobile.',
      color: 'orange'
    },
    {
      icon: 'fa-solid fa-lock',
      title: 'Sécurité Maximale',
      description: 'Authentification 2FA, chiffrement et stockage à froid.',
      color: 'red'
    },
    {
      icon: 'fa-solid fa-headset',
      title: 'Support 24/7',
      description: 'Notre équipe est disponible 24h/24 pour vous accompagner.',
      color: 'indigo'
    }
  ];

  // Testimonials
  testimonials = [
    {
      name: 'Sophie Dubois',
      role: 'Investisseuse',
      avatar: 'https://ui-avatars.com/api/?name=Sophie+Dubois&background=3b82f6&color=fff',
      content: 'La meilleure plateforme crypto que j\'ai utilisée. Interface intuitive et sécurité au top!',
      rating: 5
    },
    {
      name: 'Marc Laurent',
      role: 'Trader',
      avatar: 'https://ui-avatars.com/api/?name=Marc+Laurent&background=10b981&color=fff',
      content: 'Les graphiques en temps réel et les outils d\'analyse sont exceptionnels.',
      rating: 5
    },
    {
      name: 'Emma Martin',
      role: 'Entrepreneuse',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Martin&background=f59e0b&color=fff',
      content: 'Service client réactif et fonctionnalités parfaites pour mes besoins professionnels.',
      rating: 5
    }
  ];

  // Crypto prices (mock data)
  cryptoPrices = [
    { symbol: 'BTC', name: 'Bitcoin', price: 45234, change: 2.3, icon: 'fa-brands fa-bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', price: 3127, change: -1.2, icon: 'fa-brands fa-ethereum' },
    { symbol: 'ADA', name: 'Cardano', price: 1.23, change: 4.5, icon: 'fa-solid fa-coins' },
    { symbol: 'DOT', name: 'Polkadot', price: 23.45, change: 1.8, icon: 'fa-solid fa-circle' }
  ];

  ngOnInit(): void {
    // Trigger animations
    setTimeout(() => {
      this.isVisible = true;
    }, 100);

    // Simulate price updates
    this.updatePrices();
  }

  updatePrices(): void {
    setInterval(() => {
      this.cryptoPrices.forEach(crypto => {
        const variation = (Math.random() - 0.5) * 2; // ±1%
        crypto.change = Number((crypto.change + variation).toFixed(2));
        crypto.price = Number((crypto.price * (1 + variation / 100)).toFixed(2));
      });
    }, 5000);
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  }

  getChangeIcon(change: number): string {
    return change >= 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}