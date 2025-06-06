import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { CryptoTradingService , TradeRequest , BackendCryptoTransaction } from '../../../services/trading/crypto-trading.service';

// Define interfaces to match your HTML template expectations
export interface CryptoTransaction {
  id: string;
  clientId: string;
  symbol: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell' | 'transfer';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
  totalValue: number;
  
  // Additional properties expected by template
  date: Date;
  asset: string;
  amount: number;
  valueInFiat: number;
}

// CoinGecko API interface
export interface CoinGeckoPriceData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

@Component({
  selector: 'app-crypto-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crypto-wallet.component.html',
  styleUrls: ['./crypto-wallet.component.css']
})
export class CryptoWalletComponent implements OnInit, AfterViewInit {
  // Loading states
  isLoading = false;
  error: string | null = null;
  Math = Math; // Expose Math for use in templates
  clientId = 'fe6f2c00-b906-454a-b57d-f79c8e4f9da4';
  
  // Chart properties
  @ViewChild('cryptoChart', { static: false }) cryptoChartRef!: ElementRef<HTMLCanvasElement>;
  public chart: Chart | null = null;
  chartLoading = false;
  chartError: string | null = null;
  
  // Data
  transactions: CryptoTransaction[] = [];
  cryptoAssets: any[] = [];
  totalCryptoBalance = 0;
  totalCryptoChange24h = 0;
  
  // UI states
  selectedTimeframe = '1D';
  timeframes = ['1H', '1D', '1W', '1M'];
  
  // Modal states
  showBuyModal = false;
  showSellModal = false;
  selectedAsset: any = null;
  
  // Trade form
  tradeForm = {
    symbol: '',
    quantity: 0,
    type: 'buy' as 'buy' | 'sell'
  };

  get isChartInitialized(): boolean {
  return this.chart !== null;
}

  // Loading states for operations
  isExecutingTrade = false;
  connectionStatus: 'connecting' | 'connected' | 'error' | 'offline' = 'connecting';

  constructor(
    private cryptoTradingService: CryptoTradingService,
    private http: HttpClient
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadCryptoData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  /**
   * Initialize the chart
   */
  private initializeChart(): void {
    if (!this.cryptoChartRef?.nativeElement) {
      console.log('Chart canvas not ready yet');
      return;
    }

    const ctx = this.cryptoChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: [],
        datasets: [{
          label: 'Prix (€)',
          data: [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].label);
                return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              },
              label: (context) => {
                const value = Number(context.parsed.y);
                return `Prix: ${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 6,
              callback: function(value, index, values) {
                const date = new Date(this.getLabelForValue(value as number));
                if (this.chart.data.labels && this.chart.data.labels.length > 0) {
                  return date.toLocaleDateString('fr-FR', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: values.length > 50 ? undefined : '2-digit'
                  });
                }
                return '';
              }
            }
          },
          y: {
            display: true,
            position: 'right',
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                const numValue = Number(value);
                return numValue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  minimumFractionDigits: numValue < 1 ? 6 : 2,
                  maximumFractionDigits: numValue < 1 ? 6 : 2
                });
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
    this.loadChartData();
  }

  /**
   * Load chart data from CoinGecko API
   */
  public loadChartData(): void {
    this.chartLoading = true;
    this.chartError = null;

    // Determine the coin ID and days based on assets or default to Bitcoin
    let coinId = 'bitcoin';
    if (this.cryptoAssets.length > 0) {
      // Use the largest holding
      const largestAsset = this.cryptoAssets.reduce((prev, current) => 
        (prev.valueInFiat > current.valueInFiat) ? prev : current
      );
      coinId = this.getCoinGeckoId(largestAsset.symbol);
    }

    const days = this.getTimeframeDays(this.selectedTimeframe);
    const interval = days <= 1 ? 'hourly' : 'daily';

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=eur&days=${days}&interval=${interval}`;

    console.log(`📊 Loading chart data for ${coinId} (${days} days)`);

    this.http.get<CoinGeckoPriceData>(url).subscribe({
      next: (data) => {
        console.log('✅ Chart data loaded:', data);
        this.updateChart(data, coinId);
        this.chartLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading chart data:', error);
        this.chartError = 'Erreur de chargement du graphique';
        this.chartLoading = false;
        this.showFallbackChart();
      }
    });
  }

  /**
   * Update chart with new data
   */
  private updateChart(data: CoinGeckoPriceData, coinName: string): void {
    if (!this.chart || !data.prices) return;

    const labels = data.prices.map(([timestamp]) => new Date(timestamp));
    const prices = data.prices.map(([, price]) => price);

    // Calculate color based on price change
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;

    const borderColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    const backgroundColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = prices;
    this.chart.data.datasets[0].borderColor = borderColor;
    this.chart.data.datasets[0].backgroundColor = backgroundColor;
    this.chart.data.datasets[0].label = `${coinName} Prix (€)`;

    this.chart.update('none');
  }

  /**
   * Show fallback chart with sample data
   */
  private showFallbackChart(): void {
    if (!this.chart) return;

    const now = new Date();
    const labels = [];
    const prices = [];
    const basePrice = 45000;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(date);
      
      // Generate realistic price movement
      const variation = (Math.random() - 0.5) * 1000;
      const price = basePrice + variation;
      prices.push(Math.max(price, basePrice * 0.95));
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = prices;
    this.chart.data.datasets[0].label = 'Bitcoin Prix (€) - Données simulées';
    this.chart.update('none');
  }

  /**
   * Get CoinGecko coin ID from symbol
   */
  private getCoinGeckoId(symbol: string): string {
    const coinMap: { [key: string]: string } = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'ADAUSDT': 'cardano',
      'DOTUSDT': 'polkadot',
      'LINKUSDT': 'chainlink',
      'BNBUSDT': 'binancecoin',
      'SOLUSDT': 'solana',
      'MATICUSDT': 'matic-network',
      'AVAXUSDT': 'avalanche-2',
      'ATOMUSDT': 'cosmos'
    };
    return coinMap[symbol] || 'bitcoin';
  }

  /**
   * Get number of days for timeframe
   */
  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '1H': return 1;
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      default: return 1;
    }
  }

  /**
   * Load crypto data and portfolio information
   */
  loadCryptoData(): void {
    this.isLoading = true;
    this.error = null;
    this.connectionStatus = 'connecting';

    console.log('🔄 Attempting to connect to backend...');

    // Test API connection first
    this.cryptoTradingService.testConnection().subscribe({
      next: (response) => {
        console.log('✅ Backend connection successful:', response);
        this.connectionStatus = 'connected';
        this.loadTransactions();
      },
      error: (error) => {
        console.error('❌ Backend connection failed:', error);
        this.connectionStatus = 'error';
        this.error = `Connexion échouée: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  /**
   * Load user transactions from backend
   */
  loadTransactions(): void {
    console.log(`📊 Loading transactions for user: ${this.clientId}`);
    
    this.cryptoTradingService.getClientTransactions(this.clientId).subscribe({
      next: (backendTransactions) => {
        console.log('✅ Raw transactions from backend:', backendTransactions);
        
        if (backendTransactions && backendTransactions.length > 0) {
          // Convert backend transactions to frontend format
          this.transactions = backendTransactions.map(tx => this.mapBackendTransaction(tx));
          console.log('🔄 Mapped transactions:', this.transactions);
        } else {
          console.log('📝 No transactions found for user:', this.clientId);
          this.transactions = [];
        }
        
        this.calculatePortfolioData();
        this.isLoading = false;
        this.error = null;
      },
      error: (error) => {
        console.error('❌ Error loading transactions:', error);
        this.connectionStatus = 'error';
        this.error = `Erreur de chargement: ${error.message}`;
        this.isLoading = false;
        this.transactions = [];
        this.calculatePortfolioData();
      }
    });
  }

  /**
   * Map backend transactions to frontend format
   */
  private mapBackendTransaction(backendTx: BackendCryptoTransaction): CryptoTransaction {
    const totalValue = Number(backendTx.quantity) * Number(backendTx.price);
    
    console.log('🔄 Mapping transaction:', {
      id: backendTx.id,
      symbol: backendTx.symbol,
      side: backendTx.side,
      quantity: backendTx.quantity,
      price: backendTx.price,
      totalValue: totalValue
    });
    
    return {
      id: backendTx.id,
      clientId: backendTx.clientId,
      symbol: backendTx.symbol,
      quantity: Number(backendTx.quantity),
      price: Number(backendTx.price),
      type: this.convertSideToType(backendTx.side),
      status: this.convertStatus(backendTx.status),
      timestamp: backendTx.timestamp,
      totalValue: totalValue,
      
      // Map to template expected properties
      date: new Date(backendTx.timestamp),
      asset: this.getCryptoName(backendTx.symbol),
      amount: Number(backendTx.quantity),
      valueInFiat: totalValue
    };
  }

  /**
   * Convert backend side to frontend type
   */
  private convertSideToType(side: 'BUY' | 'SELL'): 'buy' | 'sell' | 'transfer' {
    switch (side) {
      case 'BUY': return 'buy';
      case 'SELL': return 'sell';
      default: return 'transfer';
    }
  }

  /**
   * Convert backend status to frontend status
   */
  private convertStatus(status: string): 'COMPLETED' | 'PENDING' | 'FAILED' {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'FILLED': return 'COMPLETED';
      case 'NEW': 
      case 'PARTIALLY_FILLED': return 'PENDING';
      case 'CANCELED': 
      case 'REJECTED': 
      case 'EXPIRED': return 'FAILED';
      default: 
        // If status is already in the right format
        if (['COMPLETED', 'PENDING', 'FAILED'].includes(upperStatus)) {
          return upperStatus as 'COMPLETED' | 'PENDING' | 'FAILED';
        }
        return 'PENDING';
    }
  }

  /**
   * Get crypto name from symbol
   */
  private getCryptoName(symbol: string): string {
    const nameMap: { [key: string]: string } = {
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum', 
      'ADAUSDT': 'Cardano',
      'DOTUSDT': 'Polkadot',
      'LINKUSDT': 'Chainlink',
      'BNBUSDT': 'Binance Coin',
      'SOLUSDT': 'Solana',
      'MATICUSDT': 'Polygon',
      'AVAXUSDT': 'Avalanche',
      'ATOMUSDT': 'Cosmos'
    };
    return nameMap[symbol] || symbol.replace('USDT', '');
  }

  /**
   * Calculate portfolio data from transactions
   */
  private calculatePortfolioData(): void {
    console.log('📊 Calculating portfolio data from transactions:', this.transactions);
    
    // Group transactions by symbol to calculate balances
    const balances: { [symbol: string]: { quantity: number; totalValue: number; averagePrice: number; transactions: number } } = {};
    
    this.transactions.forEach(tx => {
      if (!balances[tx.symbol]) {
        balances[tx.symbol] = { quantity: 0, totalValue: 0, averagePrice: 0, transactions: 0 };
      }
      
      if (tx.type === 'buy') {
        balances[tx.symbol].quantity += tx.amount;
        balances[tx.symbol].totalValue += tx.valueInFiat;
        balances[tx.symbol].transactions++;
      } else if (tx.type === 'sell') {
        balances[tx.symbol].quantity -= tx.amount;
        balances[tx.symbol].totalValue -= tx.valueInFiat;
        balances[tx.symbol].transactions++;
      }
    });

    // Calculate average prices and create crypto assets array (only positive balances)
    this.cryptoAssets = Object.keys(balances)
      .filter(symbol => balances[symbol].quantity > 0)
      .map(symbol => {
        const balance = balances[symbol];
        const currentPrice = this.getLatestPrice(symbol);
        const currentValue = balance.quantity * currentPrice;
        
        return {
          name: this.getCryptoName(symbol),
          symbol: symbol,
          balance: Number(balance.quantity.toFixed(8)),
          price: currentPrice,
          valueInFiat: Number(currentValue.toFixed(2)),
          change24h: this.getRandomChange(),
          icon: this.getCryptoIcon(symbol),
          color: 'text-blue-600',
          averageBuyPrice: balance.quantity > 0 ? Number((balance.totalValue / balance.quantity).toFixed(2)) : 0,
          profitLoss: Number((currentValue - balance.totalValue).toFixed(2)),
          profitLossPercent: balance.totalValue > 0 ? Number((((currentValue - balance.totalValue) / balance.totalValue) * 100).toFixed(2)) : 0
        };
      });

    // Calculate total portfolio value
    this.totalCryptoBalance = this.cryptoAssets.reduce((sum, asset) => sum + asset.valueInFiat, 0);
    this.totalCryptoChange24h = this.getRandomChange();
    
    // Refresh chart when portfolio changes
    if (this.chart) {
      setTimeout(() => this.loadChartData(), 500);
    }
    
    console.log('✅ Portfolio calculated:', {
      totalBalance: this.totalCryptoBalance,
      assets: this.cryptoAssets.length,
      transactions: this.transactions.length
    });
  }

  /**
   * Get latest price for symbol from transactions
   */
  private getLatestPrice(symbol: string): number {
    const symbolTransactions = this.transactions
      .filter(tx => tx.symbol === symbol)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return symbolTransactions.length > 0 ? symbolTransactions[0].price : 0;
  }

  /**
   * Open buy modal
   */
  openBuyCryptoModal(asset?: any): void {
    this.selectedAsset = asset;
    this.tradeForm = {
      symbol: asset ? asset.symbol : 'BTCUSDT',
      quantity: 0,
      type: 'buy'
    };
    this.showBuyModal = true;
  }

  /**
   * Open sell modal
   */
  openSellCryptoModal(asset?: any): void {
    this.selectedAsset = asset;
    this.tradeForm = {
      symbol: asset ? asset.symbol : 'BTCUSDT',
      quantity: 0,
      type: 'sell'
    };
    this.showSellModal = true;
  }

  /**
   * Execute buy order via backend API
   */
  executeBuy(): void {
    if (!this.tradeForm.symbol || this.tradeForm.quantity <= 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    this.isExecutingTrade = true;
    
    const request: TradeRequest = {
      clientId: this.clientId,
      symbol: this.tradeForm.symbol,
      quantity: this.tradeForm.quantity
    };

    console.log('🚀 Executing buy order:', request);

    this.cryptoTradingService.buyAsset(request).subscribe({
      next: (response) => {
        console.log('✅ Buy order executed successfully:', response);
        alert('Ordre d\'achat exécuté avec succès!');
        this.showBuyModal = false;
        this.isExecutingTrade = false;
        
        // Refresh transactions to show the new order
        setTimeout(() => {
          this.loadTransactions();
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Buy order failed:', error);
        alert(`Erreur lors de l'exécution de l'ordre d'achat: ${error.message}`);
        this.isExecutingTrade = false;
      }
    });
  }

  /**
   * Execute sell order via backend API
   */
  executeSell(): void {
    if (!this.tradeForm.symbol || this.tradeForm.quantity <= 0) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    // Check if user has enough balance
    const asset = this.cryptoAssets.find(a => a.symbol === this.tradeForm.symbol);
    if (asset && this.tradeForm.quantity > asset.balance) {
      alert(`Solde insuffisant. Vous avez ${asset.balance} ${asset.symbol} disponible.`);
      return;
    }

    this.isExecutingTrade = true;
    
    const request: TradeRequest = {
      clientId: this.clientId,
      symbol: this.tradeForm.symbol,
      quantity: this.tradeForm.quantity
    };

    console.log('🚀 Executing sell order:', request);

    this.cryptoTradingService.sellAsset(request).subscribe({
      next: (response) => {
        console.log('✅ Sell order executed successfully:', response);
        alert('Ordre de vente exécuté avec succès!');
        this.showSellModal = false;
        this.isExecutingTrade = false;
        
        // Refresh transactions to show the new order
        setTimeout(() => {
          this.loadTransactions();
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Sell order failed:', error);
        alert(`Erreur lors de l'exécution de l'ordre de vente: ${error.message}`);
        this.isExecutingTrade = false;
      }
    });
  }

  /**
   * Retry connection to backend
   */
  retryConnection(): void {
    console.log('🔄 Retrying connection...');
    this.loadCryptoData();
  }

  /**
   * Get connection status color
   */
  getConnectionStatusColor(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get connection status text
   */
  getConnectionStatusText(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Connecté';
      case 'connecting': return 'Connexion...';
      case 'error': return 'Erreur de connexion';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  }

  // Template helper methods (keep all existing ones)
  getCurrentDate(): Date {
    return new Date();
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  }

  getChangeIcon(change: number): string {
    return change >= 0 ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';
  }

  formatChangeValue(change: number): string {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  setTimeframe(timeframe: string): void {
    this.selectedTimeframe = timeframe;
    this.loadChartData(); // Load chart data when timeframe changes
  }

  selectCoin(coinName: string): void {
    console.log('Selected coin:', coinName);
  }

  // Helper methods
  public getRandomChange(): number {
    return (Math.random() - 0.5) * 10; // Random change between -5% and +5%
  }

  getCryptoIcon(symbol: string): string {
    const iconMap: { [key: string]: string } = {
      'BTCUSDT': 'fa-brands fa-bitcoin',
      'ETHUSDT': 'fa-brands fa-ethereum',
      'ADAUSDT': 'fa-solid fa-coins',
      'DOTUSDT': 'fa-solid fa-circle',
      'LINKUSDT': 'fa-solid fa-link',
      'BNBUSDT': 'fa-solid fa-coins',
      'SOLUSDT': 'fa-solid fa-sun',
      'MATICUSDT': 'fa-solid fa-network-wired',
      'AVAXUSDT': 'fa-solid fa-mountain',
      'ATOMUSDT': 'fa-solid fa-atom'
    };
    return iconMap[symbol] || 'fa-solid fa-coins';
  }

  /**
   * Get transaction type for display
   */
  getTransactionType(type: 'buy' | 'sell' | 'transfer'): string {
    return type;
  }

  /**
   * Check if transaction type matches
   */
  isTransactionType(txType: 'buy' | 'sell' | 'transfer', compareType: string): boolean {
    return txType === compareType;
  }

  /**
   * Get transaction type display text (full)
   */
  getTransactionTypeText(txType: 'buy' | 'sell' | 'transfer'): string {
    switch (txType) {
      case 'buy': return 'Achat';
      case 'sell': return 'Vente';
      case 'transfer': return 'Transfert';
      default: return 'Inconnu';
    }
  }

  /**
   * Get transaction type display text (short)
   */
  getTransactionTypeShort(txType: 'buy' | 'sell' | 'transfer'): string {
    switch (txType) {
      case 'buy': return 'A';
      case 'sell': return 'V';
      case 'transfer': return 'T';
      default: return '?';
    }
  }

  /**
   * Get transaction CSS classes
   */
  getTransactionClasses(txType: 'buy' | 'sell' | 'transfer'): { [key: string]: boolean } {
    return {
      'bg-green-100 text-green-800': txType === 'buy',
      'bg-red-100 text-red-800': txType === 'sell',
      'bg-blue-100 text-blue-800': txType === 'transfer'
    };
  }

  searchTerm: string = '';
  onSearchChange(term: string): void {
    this.searchTerm = term;
  }

  get filteredTransactions() {
    if (!this.searchTerm) return this.transactions;
    return this.transactions.filter(tx => 
      tx.asset.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      tx.symbol.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
  }

  get paginatedTransactions() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredTransactions.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const totalPages = this.totalPages;
    const current = this.currentPage;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Separator
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // Separator
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Separator
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Separator
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  // Quick percentage selection for selling
  setQuantityPercent(percent: number): void {
    if (this.selectedAsset) {
      this.tradeForm.quantity = (this.selectedAsset.balance * percent) / 100;
    }
  }

  // TrackBy functions for performance
  trackByAssetSymbol(index: number, asset: any): string {
    return asset.symbol;
  }

  trackByTransactionId(index: number, transaction: any): string {
    return transaction.id;
  }

  // Status helpers
  getStatusText(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'Complété';
      case 'PENDING': return 'En cours';
      case 'FAILED': return 'Échoué';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return '✓';
      case 'PENDING': return '⏳';
      case 'FAILED': return '✗';
      default: return '?';
    }
  }
}