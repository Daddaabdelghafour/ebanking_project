import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  last_updated: string;
}

export interface CryptoAsset {
  name: string;
  symbol: string;
  icon: string;
  image: string;
  color: string;
  price: number;
  balance: number;
  valueInFiat: number;
  change24h: number;

}

export interface CryptoMarketChart {
  prices: [number, number][];  // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'buy' | 'sell' | 'transfer';
  asset: string;
  symbol: string;
  amount: number;
  price: number;
  valueInFiat: number;
  status: 'completed' | 'pending' | 'failed';
}

@Injectable({
  providedIn: 'root'
})
export class CryptoApiService {
  private coingeckoApiUrl = 'https://api.coingecko.com/api/v3';
  
  // List of coins we support in our app
  private supportedCoins = ['bitcoin', 'ethereum', 'cardano', 'solana'];
  
  // Cache for price data
  private priceCache: { [key: string]: { data: CoinPrice[], timestamp: number } } = {};
  // Cache validity in milliseconds (5 minutes)
  private cacheDuration = 5 * 60 * 1000;

  constructor(private http: HttpClient) {}

  /**
   * Get current prices for supported cryptocurrencies
   */
  getCryptoPrices(currency: string = 'eur'): Observable<CoinPrice[]> {
    const cacheKey = `prices_${currency}`;
    const cachedData = this.priceCache[cacheKey];
    
    // Return cached data if available and valid
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheDuration)) {
      return of(cachedData.data);
    }
    
    // Otherwise fetch from API
    return this.http.get<CoinPrice[]>(
      `${this.coingeckoApiUrl}/coins/markets?vs_currency=${currency}&ids=${this.supportedCoins.join(',')}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`
    ).pipe(
      tap(data => {
        // Update cache
        this.priceCache[cacheKey] = {
          data,
          timestamp: Date.now()
        };
      }),
      catchError(error => {
        console.error('Error fetching crypto prices', error);
        return throwError(() => new Error('Failed to fetch cryptocurrency prices. Please try again later.'));
      })
    );
  }

  /**
   * Get historical chart data for a specific coin
   */
  getCoinChart(coinId: string, days: number = 30, currency: string = 'eur'): Observable<CryptoMarketChart> {
    return this.http.get<CryptoMarketChart>(
      `${this.coingeckoApiUrl}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
    ).pipe(
      catchError(error => {
        console.error(`Error fetching chart data for ${coinId}`, error);
        return throwError(() => new Error(`Failed to fetch chart data for ${coinId}. Please try again later.`));
      })
    );
  }

  /**
   * Get user's crypto assets (in a real app this would come from a backend API)
   */
  getUserCryptoAssets(): Observable<CryptoAsset[]> {
    // In a real app, this would be an API call to get the user's assets
    return this.getCryptoPrices().pipe(
      map(prices => {
        // Mock user balances - in a real app this would come from your backend
        const userBalances: { [key: string]: number } = {
          'bitcoin': 0.25,
          'ethereum': 2.5,
          'cardano': 1500,
          'solana': 10
        };
        
        // Map the prices to assets with user balances
        return prices.map(coin => {
          const balance = userBalances[coin.id] || 0;
          const iconColors: { [key: string]: string } = {
            'bitcoin': 'text-amber-600',
            'ethereum': 'text-purple-600',
            'cardano': 'text-blue-600',
            'solana': 'text-pink-600'
          };
          
          const icons: { [key: string]: string } = {
            'bitcoin': 'fa-brands fa-bitcoin',
            'ethereum': 'fa-brands fa-ethereum',
            'cardano': 'fa-solid fa-certificate',
            'solana': 'fa-solid fa-sun'
          };
          
          return {
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            icon: icons[coin.id] || 'fa-solid fa-coins',
            image: coin.image,
            color: iconColors[coin.id] || 'text-gray-600',
            price: coin.current_price,
            balance: balance,
            valueInFiat: balance * coin.current_price,
            change24h: coin.price_change_percentage_24h
          };
        });
      }),
      catchError(error => {
        console.error('Error processing user crypto assets', error);
        return throwError(() => new Error('Failed to load your cryptocurrency assets. Please try again later.'));
      })
    );
  }

  /**
   * Get user's transaction history (in a real app this would come from a backend API)
   */
  getUserTransactions(): Observable<Transaction[]> {
    // Mock data - in a real app, this would be an API call
    return of([
      {
        id: 'tr1',
        date: new Date(2023, 3, 15),
        type: 'buy',
        asset: 'Bitcoin',
        symbol: 'BTC',
        amount: 0.05,
        price: 52000,
        valueInFiat: 2600,
        status: 'completed'
      },
      {
        id: 'tr2',
        date: new Date(2023, 3, 10),
        type: 'sell',
        asset: 'Ethereum',
        symbol: 'ETH',
        amount: 1.2,
        price: 2450,
        valueInFiat: 2940,
        status: 'completed'
      },
      {
        id: 'tr3',
        date: new Date(2023, 3, 5),
        type: 'buy',
        asset: 'Cardano',
        symbol: 'ADA',
        amount: 1000,
        price: 1.15,
        valueInFiat: 1150,
        status: 'completed'
      },
      {
        id: 'tr4',
        date: new Date(2023, 2, 28),
        type: 'transfer',
        asset: 'Bitcoin',
        symbol: 'BTC',
        amount: 0.1,
        price: 51000,
        valueInFiat: 5100,
        status: 'completed'
      },
      {
        id: 'tr5',
        date: new Date(),
        type: 'buy',
        asset: 'Solana',
        symbol: 'SOL',
        amount: 5,
        price: 100.5,
        valueInFiat: 502.5,
        status: 'pending'
      }
    ]);
  }
}