import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Simple Interfaces
interface Transfer {
  id: string;
  reference: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  stripePaymentIntentId?: string;
    stripeTransferId?: string; // Make this optional

}

interface PaymentRequestDTO {
  sourceUserId: string;
  destinationStripeAccountId: string;
  amount: number;
  currency: string;
  description: string;
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  
  // Your specific Stripe accounts
  sourceAccount = 'acct_1RUmvBR0Nq5gEshg';
  destinationAccount = 'acct_1RTS8NR4PPYsehS2';
  
  // State
  isLoading = false;
  isSubmitting = false;
  showSuccess = false;
  showError = false;
  successMessage = '';
  errorMessage = '';
  
  // Data
  transfers: Transfer[] = [];
  transferForm: FormGroup;
  
  // API Config
  private apiUrl = 'http://localhost:8085/E-BANKING1/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.transferForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTransfers();
  }

  /**
   * Create transfer form
   */
  createForm(): FormGroup {
    return this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01), Validators.max(10000)]],
      description: ['Transfer between accounts', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Submit transfer
   */
  onSubmit(): void {
    if (this.transferForm.invalid || this.isSubmitting) {
      this.showErrorMessage('Please fill all required fields correctly.');
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();

    const formData = this.transferForm.value;
    
    // Create payment request
    const paymentRequest: PaymentRequestDTO = {
      sourceUserId: this.sourceAccount,
      destinationStripeAccountId: this.destinationAccount,
      amount: Math.round(formData.amount * 100), // Convert to cents
      currency: 'eur',
      description: formData.description
    };

    console.log('🚀 Sending payment request:', paymentRequest);
    console.log(`💰 From: ${this.sourceAccount} → To: ${this.destinationAccount}`);

    // Make API call
    this.http.post(`${this.apiUrl}/transaction/pay`, paymentRequest, this.httpOptions)
      .pipe(
        tap((response: any) => {
          console.log('✅ Payment successful:', response);
          
          // Add to transfers list
          const newTransfer: Transfer = {
            id: response.id || Date.now().toString(),
            reference: `TXN-${Date.now()}`,
            fromAccount: this.sourceAccount,
            toAccount: this.destinationAccount,
            amount: formData.amount,
            currency: 'EUR',
            status: response.status === 'succeeded' ? 'completed' : 'processing',
            description: formData.description,
            createdAt: new Date().toISOString(),
            stripePaymentIntentId: response.id
          };

          this.transfers.unshift(newTransfer);
          this.showSuccessMessage(`✅ Transfer successful! Payment ID: ${response.id}`);
          this.resetForm();
        }),
        catchError(error => {
          console.error('❌ Payment failed:', error);
          
          let errorMsg = 'Transfer failed. Please try again.';
          if (error.error && error.error.message) {
            errorMsg = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMsg = error.error;
          }
          
          this.showErrorMessage(`❌ ${errorMsg}`);
          return of(null);
        }),
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe();
  }

  /**
   * Load transfer history
   */
  loadTransfers(): void {
    // Demo transfers
    this.transfers = [
      {
        id: '1',
        reference: 'TXN-DEMO-001',
        fromAccount: this.sourceAccount,
        toAccount: this.destinationAccount,
        amount: 100.00,
        currency: 'EUR',
        status: 'completed',
        description: 'Test transfer',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        stripePaymentIntentId: 'pi_demo_123'
      }
    ];
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.transferForm.reset();
    this.transferForm.patchValue({
      description: 'Transfer between accounts'
    });
  }

  /**
   * Show success message
   */
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    this.showError = false;
  }

  /**
   * Show error message
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    this.showSuccess = false;
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.showSuccess = false;
    this.showError = false;
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Close error message
   */
  closeError(): void {
    this.showError = false;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status class for styling
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status text
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return status;
    }
  }
}