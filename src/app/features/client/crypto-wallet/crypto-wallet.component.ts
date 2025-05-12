import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CryptoApiService , Transaction , CryptoAsset } from '../../../services/crypto-api.service';
import { Subscription, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-crypto-wallet',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DatePipe],
  templateUrl: './crypto-wallet.component.html',
  styleUrls: ['./crypto-wallet.component.css'],
  providers: [CryptoApiService]
})
export class CryptoWalletComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cryptoChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  timeframes: Array<'1J'|'1S'|'1M'|'3M'|'6M'|'1A'|'Tout'> = ['1J', '1S', '1M', '3M', '6M', '1A', 'Tout'];
  selectedTimeframe: '1J'|'1S'|'1M'|'3M'|'6M'|'1A'|'Tout' = '1M';
  totalCryptoBalance = 0;
  totalCryptoChange24h = 0;
  
  cryptoAssets: CryptoAsset[] = [];
  transactions: Transaction[] = [];
  
  isLoading = true;
  error: string | null = null;
  
  private chart!: Chart;
  private subscriptions: Subscription = new Subscription();
  private selectedCoin = 'bitcoin'; // Default coin for chart
  
  constructor(private cryptoApiService: CryptoApiService) {}

  ngOnInit(): void {
    this.loadCryptoData();
  }

  ngAfterViewInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    
    this.subscriptions.unsubscribe();
  }
  
  loadCryptoData(): void {
    this.isLoading = true;
    
    const assetsSub = this.cryptoApiService.getUserCryptoAssets().subscribe({
      next: (assets) => {
        this.cryptoAssets = assets;
        this.calculateTotalBalance();
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
    
    const txSub = this.cryptoApiService.getUserTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(assetsSub);
    this.subscriptions.add(txSub);
  }
  
  loadChartData(): void {
    // Convert days from selected timeframe to numeric value
    const daysMap: Record<'1J'|'1S'|'1M'|'3M'|'6M'|'1A'|'Tout', number|string> = {
      '1J': 1,
      '1S': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1A': 365,
      'Tout': 'max'
    };
    
    const daysValue = daysMap[this.selectedTimeframe] || 30;
    // Convert 'max' string to undefined, which the API will interpret as maximum time range
    const days = daysValue === 'max' ? undefined : Number(daysValue);
    
    this.subscriptions.add(
      this.cryptoApiService.getCoinChart(this.selectedCoin, days).subscribe({
        next: (chartData) => {
          this.renderChart(chartData.prices);
        },
        error: (err) => {
          console.error('Error loading chart data', err);
          // Create an empty chart if data fails
          this.renderChart([]);
        }
      })
    );
  }
  
  renderChart(priceData: [number, number][]): void {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    if (!ctx) return;
    
    // If chart already exists, destroy it
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Format data for Chart.js
    const labels = priceData.map(data => new Date(data[0]).toLocaleDateString());
    const prices = priceData.map(data => data[1]);
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${this.selectedCoin.charAt(0).toUpperCase() + this.selectedCoin.slice(1)} Price`,
          data: prices,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 6
            }
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return '€' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        }
      }
    });
  }
  
  calculateTotalBalance(): void {
    this.totalCryptoBalance = this.cryptoAssets.reduce(
      (total, asset) => total + asset.valueInFiat, 0
    );
    
    // Calculate weighted average 24h change
    let totalValue = 0;
    let weightedChange = 0;
    
    this.cryptoAssets.forEach(asset => {
      totalValue += asset.valueInFiat;
      weightedChange += (asset.change24h * asset.valueInFiat);
    });
    
    this.totalCryptoChange24h = totalValue > 0 ? weightedChange / totalValue : 0;
  }
  
  setTimeframe(timeframe: '1J'|'1S'|'1M'|'3M'|'6M'|'1A'|'Tout'): void {
    this.selectedTimeframe = timeframe;
    this.loadChartData();
  }
  
  selectCoin(coinId: string): void {
    this.selectedCoin = coinId;
    this.loadChartData();
  }
  
  getChangeClass(change: number): string {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }
  
  getChangeIcon(change: number): string {
    return change >= 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';
  }
  
  formatChangeValue(change: number): string {
    const prefix = change >= 0 ? '+' : '';
    return `${prefix}${change.toFixed(2)}%`;
  }
  
  openBuyCryptoModal(asset?: CryptoAsset): void {
    // In a real app, this would open a modal to buy crypto
    console.log('Open buy modal for:', asset || 'any crypto');
  }
  
  openSellCryptoModal(asset?: CryptoAsset): void {
    // In a real app, this would open a modal to sell crypto
    console.log('Open sell modal for:', asset || 'any crypto');
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  getCurrentDate(): Date {
    return new Date();
  }
}