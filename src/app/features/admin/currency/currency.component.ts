import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.css']
})
export class CurrencyComponent implements OnInit {
  // Currency Management
  currencies: Currency[] = [];
  showModal = false;
  isEditing = false;
  selectedCurrency: Currency | null = null;
  currencyForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.currencyForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(3)]],
      name: ['', Validators.required],
      symbol: ['', Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Load demo currencies
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    // This would come from an API in a real app
    this.currencies = [
      { id: '1', code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0000, isActive: true },
      { id: '2', code: 'EUR', name: 'Euro', symbol: '€', rate: 0.9410, isActive: true },
      { id: '3', code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.8107, isActive: true },
      { id: '4', code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 151.6500, isActive: true },
      { id: '5', code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.3640, isActive: true },
      { id: '6', code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.5230, isActive: true },
      { id: '7', code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.9047, isActive: true },
      { id: '8', code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.2550, isActive: true }
    ];
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedCurrency = null;
    this.currencyForm.reset({isActive: true});
    this.showModal = true;
  }

  openEditModal(currency: Currency): void {
    this.isEditing = true;
    this.selectedCurrency = currency;
    this.currencyForm.patchValue({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      rate: currency.rate,
      isActive: currency.isActive
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCurrency(): void {
    if (this.currencyForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.currencyForm.controls).forEach(key => {
        this.currencyForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formData = this.currencyForm.value;
    
    if (this.isEditing && this.selectedCurrency) {
      // Update existing currency
      const index = this.currencies.findIndex(c => c.id === this.selectedCurrency!.id);
      if (index !== -1) {
        this.currencies[index] = {
          ...this.selectedCurrency,
          code: formData.code,
          name: formData.name,
          symbol: formData.symbol,
          rate: formData.rate,
          isActive: formData.isActive
        };
      }
    } else {
      // Add new currency
      const newCurrency: Currency = {
        id: Math.random().toString(36).substr(2, 9),
        code: formData.code,
        name: formData.name,
        symbol: formData.symbol,
        rate: formData.rate,
        isActive: formData.isActive
      };
      this.currencies.push(newCurrency);
    }

    this.closeModal();
  }

  deleteCurrency(id: string): void {
    if (confirm('Are you sure you want to delete this currency?')) {
      this.currencies = this.currencies.filter(c => c.id !== id);
    }
  }

  // UI Helper methods
  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  }

  showValidationError(controlName: string): boolean {
    const control = this.currencyForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  exportData() {
    alert('Exporting currency data...');
    // Implement export functionality
  }
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  isActive: boolean;
}