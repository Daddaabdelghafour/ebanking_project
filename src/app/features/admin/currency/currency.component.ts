import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CurrencyApiService
 } from '../../../services/currency/currency-api.service';
import { Currency } from '../../../shared/models/currency.model';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css'],
  providers: [CurrencyApiService]
})
export class CurrencyComponent implements OnInit {
  // Currency Management
  currencies: Currency[] = [];
  showModal = false;
  Math = Math;
  isEditing = false;
  selectedCurrency: Currency | null = null;
  currencyForm: FormGroup;
  isLoading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  // Filter
  filterText = '';
  
  constructor(
    private fb: FormBuilder,
    private currencyApiService: CurrencyApiService
  ) {
    this.currencyForm = this.fb.group({
      id: [''],
      code: ['', [Validators.required, Validators.maxLength(3)]],
      name: ['', Validators.required],
      symbol: ['', Validators.required],
      rate: ['', [Validators.required, Validators.min(0.0001)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.isLoading = true;
    this.error = null;
    
    // First try to load from localStorage
    const savedCurrencies = localStorage.getItem('currencies');
    const savedTimestamp = localStorage.getItem('currencies_timestamp');
    
    if (savedCurrencies && savedTimestamp) {
      const parsedCurrencies: Currency[] = JSON.parse(savedCurrencies);
      this.lastUpdated = new Date(parseInt(savedTimestamp));
      
      // Check if the data is less than 3 hours old
      const now = new Date().getTime();
      const timestamp = parseInt(savedTimestamp);
      
      if (now - timestamp < 3 * 60 * 60 * 1000) { // 3 hours in milliseconds
        this.currencies = parsedCurrencies;
        this.isLoading = false;
        return;
      }
    }
    
    // Otherwise fetch from API
    this.currencyApiService.getAllCurrencies().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
        this.lastUpdated = new Date();
        this.isLoading = false;
        
        // Save to localStorage
        localStorage.setItem('currencies', JSON.stringify(this.currencies));
        localStorage.setItem('currencies_timestamp', Date.now().toString());
      },
      error: (err) => {
        this.error = err.message;
        this.isLoading = false;
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedCurrency = null;
    this.currencyForm.reset({
      isActive: true,
      rate: 1.0000
    });
    this.showModal = true;
  }

  openEditModal(currency: Currency): void {
    this.isEditing = true;
    this.selectedCurrency = { ...currency };
    this.currencyForm.patchValue(this.selectedCurrency);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCurrency(): void {
    if (this.currencyForm.invalid) return;
    
    const formValue = this.currencyForm.value;
    
    if (this.isEditing && this.selectedCurrency) {
      // Update existing currency
      const updatedCurrency: Currency = {
        ...this.selectedCurrency,
        ...formValue,
        lastUpdated: new Date()
      };
      
      const index = this.currencies.findIndex(c => c.id === updatedCurrency.id);
      if (index !== -1) {
        this.currencies[index] = updatedCurrency;
      }
    } else {
      // Add new currency
      const newCurrency: Currency = {
        ...formValue,
        id: formValue.code.toLowerCase(),
        lastUpdated: new Date()
      };
      
      // Check if currency already exists
      const existingIndex = this.currencies.findIndex(c => c.code === newCurrency.code);
      if (existingIndex !== -1) {
        this.error = `La devise avec le code ${newCurrency.code} existe déjà.`;
        return;
      }
      
      this.currencies.push(newCurrency);
    }
    
    // Save to localStorage
    localStorage.setItem('currencies', JSON.stringify(this.currencies));
    localStorage.setItem('currencies_timestamp', Date.now().toString());
    
    // Close modal and reset form
    this.closeModal();
  }

  deleteCurrency(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette devise?')) {
      this.currencies = this.currencies.filter(c => c.id !== id);
      
      // Save to localStorage
      localStorage.setItem('currencies', JSON.stringify(this.currencies));
    }
  }

  // UI Helper methods
  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  }

  showValidationError(controlName: string): boolean {
    const control = this.currencyForm.get(controlName);
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  exportData(): void {
    // Create CSV content
    const headers = ['Code', 'Nom', 'Symbole', 'Taux de Change', 'Statut'];
    const csvRows = [
      headers.join(','),
      ...this.currencies.map(c => 
        [
          c.code,
          c.name.replace(/,/g, ' '),
          c.symbol,
          c.rate,
          c.isActive ? 'Actif' : 'Inactif'
        ].join(',')
      )
    ];
    const csvContent = csvRows.join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `currency-rates-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  refreshRates(): void {
    // Force a refresh of rates from API
    localStorage.removeItem('currencies');
    localStorage.removeItem('currencies_timestamp');
    this.loadCurrencies();
  }
  
  getPaginatedCurrencies(): Currency[] {
    // Filter currencies
    const filtered = this.filterText 
      ? this.currencies.filter(c => 
          c.code.toLowerCase().includes(this.filterText.toLowerCase()) ||
          c.name.toLowerCase().includes(this.filterText.toLowerCase())
        )
      : this.currencies;
      
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    const filtered = this.filterText 
      ? this.currencies.filter(c => 
          c.code.toLowerCase().includes(this.filterText.toLowerCase()) ||
          c.name.toLowerCase().includes(this.filterText.toLowerCase())
        )
      : this.currencies;
      
    return Math.ceil(filtered.length / this.itemsPerPage);
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}