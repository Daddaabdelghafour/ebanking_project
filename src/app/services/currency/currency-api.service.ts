import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Currency } from '../../shared/models/currency.model';
@Injectable({
  providedIn: 'root'
})
export class CurrencyApiService {
  private readonly API_URL = 'https://open.er-api.com/v6/latest/USD';
  private cachedRates: { [key: string]: number } = {};
  private lastFetchTime = 0;
  private cacheDuration = 3600000; // 1 hour in milliseconds
  
  constructor(private http: HttpClient) {}
  
  /**
   * Fetch the latest exchange rates from the API or return cached values if recent
   */
  getExchangeRates(): Observable<{ [key: string]: number }> {
    // Check if we have recently cached data
    const now = Date.now();
    if (Object.keys(this.cachedRates).length > 0 && (now - this.lastFetchTime < this.cacheDuration)) {
      return of(this.cachedRates);
    }
    
    // Otherwise fetch from API
    return this.http.get<any>(this.API_URL).pipe(
      map(response => {
        if (response && response.rates) {
          return response.rates;
        }
        throw new Error('Invalid API response format');
      }),
      tap(rates => {
        this.cachedRates = rates;
        this.lastFetchTime = now;
      }),
      catchError(error => {
        console.error('Error fetching exchange rates', error);
        
        // If we have cached data, return it even if it's outdated
        if (Object.keys(this.cachedRates).length > 0) {
          return of(this.cachedRates);
        }
        
        return throwError(() => new Error('Failed to fetch currency exchange rates. Please try again later.'));
      })
    );
  }
  
  /**
   * Convert a list of currency codes to Currency objects with exchange rates
   */
  getCurrenciesWithRates(currencyCodes: string[]): Observable<Currency[]> {
    return this.getExchangeRates().pipe(
      map(rates => {
        return currencyCodes.map(code => {
          const rate = rates[code] || 1;
          return {
            id: code.toLowerCase(),
            code: code,
            name: this.getCurrencyName(code),
            symbol: this.getCurrencySymbol(code),
            rate: rate,
            isActive: true
          };
        });
      })
    );
  }
  
  /**
   * Get a complete list of available currencies with exchange rates
   */
  getAllCurrencies(): Observable<Currency[]> {
    return this.getExchangeRates().pipe(
      map(rates => {
        return Object.keys(rates).map(code => {
          return {
            id: code.toLowerCase(),
            code: code,
            name: this.getCurrencyName(code),
            symbol: this.getCurrencySymbol(code),
            rate: rates[code],
            isActive: true
          };
        });
      })
    );
  }
  
  /**
   * Get currency name for a given code
   */
  private getCurrencyName(code: string): string {
    const currencyNames: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'AUD': 'Australian Dollar',
      'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'MAD': 'Moroccan Dirham',
      'INR': 'Indian Rupee',
      'BRL': 'Brazilian Real',
      'RUB': 'Russian Ruble',
      'KRW': 'South Korean Won',
      'SGD': 'Singapore Dollar',
      'NZD': 'New Zealand Dollar',
      'MXN': 'Mexican Peso',
      'AED': 'United Arab Emirates Dirham',
      'SAR': 'Saudi Riyal',
      'ZAR': 'South African Rand',
      'TRY': 'Turkish Lira',
      'XAF': 'Central African CFA Franc',
      'XOF': 'West African CFA Franc',
    };
    
    return currencyNames[code] || `Currency (${code})`;
  }
  
  /**
   * Get currency symbol for a given code
   */
  private getCurrencySymbol(code: string): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'Fr',
      'CNY': '¥',
      'MAD': 'MAD',
      'INR': '₹',
      'BRL': 'R$',
      'RUB': '₽',
      'KRW': '₩',
      'SGD': 'S$',
      'NZD': 'NZ$',
      'MXN': 'Mex$',
      'AED': 'د.إ',
      'SAR': '﷼',
      'ZAR': 'R',
      'TRY': '₺',
      'XAF': 'FCFA',
      'XOF': 'CFA',
    };
    
    return currencySymbols[code] || code;
  }
}