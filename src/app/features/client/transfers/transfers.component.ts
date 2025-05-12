import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bank: string;
  iconColor: string;
  lastTransfer?: Date;
  favorite: boolean;
}

interface Transfer {
  id: string;
  recipient: string;
  recipientAccount: string;
  amount: number;
  date: Date;
  purpose?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.css']
})
export class TransfersComponent implements OnInit {
  transferForm: FormGroup;
  selectedBeneficiary: Beneficiary | null = null;
  showBeneficiaryList = false;
  showConfirmation = false;
  beneficiaries: Beneficiary[] = [];
  transfers: Transfer[] = [];
  
  constructor(private fb: FormBuilder) {
    this.transferForm = this.fb.group({
      beneficiaryId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      purpose: [''],
      reference: ['']
    });
  }

  ngOnInit(): void {
    // In a real app, these would be loaded from a service
    this.loadBeneficiaries();
    this.loadTransfers();
  }

  loadBeneficiaries(): void {
    this.beneficiaries = [
      {
        id: 'ben1',
        name: 'Ahmed Benali',
        accountNumber: 'MA140000012345678901234567',
        bank: 'Banque Populaire',
        iconColor: 'bg-blue-600',
        lastTransfer: new Date(2023, 3, 15),
        favorite: true
      },
      {
        id: 'ben2',
        name: 'Fatima Zahra',
        accountNumber: 'MA140000098765432109876543',
        bank: 'Attijariwafa Bank',
        iconColor: 'bg-green-600',
        lastTransfer: new Date(2023, 2, 28),
        favorite: true
      },
      {
        id: 'ben3',
        name: 'Youssef El Mansouri',
        accountNumber: 'MA140000076543210987654321',
        bank: 'BMCE Bank',
        iconColor: 'bg-purple-600',
        lastTransfer: new Date(2023, 1, 20),
        favorite: false
      }
    ];
  }

  loadTransfers(): void {
    this.transfers = [
      {
        id: 'tr1',
        recipient: 'Ahmed Benali',
        recipientAccount: 'MA14****4567',
        amount: 1500.00,
        date: new Date(2023, 3, 15),
        purpose: 'Remboursement',
        status: 'completed',
        reference: 'REF123456'
      },
      {
        id: 'tr2',
        recipient: 'Fatima Zahra',
        recipientAccount: 'MA14****6543',
        amount: 800.00,
        date: new Date(2023, 3, 10),
        purpose: 'Loyer',
        status: 'completed',
        reference: 'REF789012'
      },
      {
        id: 'tr3',
        recipient: 'Youssef El Mansouri',
        recipientAccount: 'MA14****4321',
        amount: 250.00,
        date: new Date(2023, 3, 5),
        purpose: 'Facture',
        status: 'failed',
        reference: 'REF345678'
      },
      {
        id: 'tr4',
        recipient: 'Ahmed Benali',
        recipientAccount: 'MA14****4567',
        amount: 2000.00,
        date: new Date(2023, 2, 28),
        purpose: 'Paiement',
        status: 'completed',
        reference: 'REF901234'
      },
      {
        id: 'tr5',
        recipient: 'Fatima Zahra',
        recipientAccount: 'MA14****6543',
        amount: 300.00,
        date: new Date(),
        purpose: 'Divers',
        status: 'pending',
        reference: 'REF567890'
      }
    ];
  }

  toggleBeneficiaryList(): void {
    this.showBeneficiaryList = !this.showBeneficiaryList;
  }

  selectBeneficiary(beneficiary: Beneficiary): void {
    this.selectedBeneficiary = beneficiary;
    this.transferForm.patchValue({
      beneficiaryId: beneficiary.id
    });
    this.showBeneficiaryList = false;
  }

  getSelectedBeneficiary(): Beneficiary | null {
    const id = this.transferForm.get('beneficiaryId')?.value;
    return this.beneficiaries.find(b => b.id === id) || null;
  }

  getBeneficiaryInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  submitTransfer(): void {
    if (this.transferForm.valid && this.selectedBeneficiary) {
      this.confirmTransfer();
    }
  }

  confirmTransfer(): void {
    // In a real app, this would call an API to process the transfer
    this.showConfirmation = true;
    
    const selectedBeneficiary = this.getSelectedBeneficiary();
    const accountNumber = selectedBeneficiary?.accountNumber || '';
    let maskedAccount = '';
    
    if (accountNumber) {
      // Create a masked version of the account number (first 4 chars + **** + last 7 chars)
      maskedAccount = accountNumber.substring(0, 4) + '****' + 
                     accountNumber.substring(accountNumber.length - 7);
    }
    
    // Add the new transfer to the list (in a real app, this would be returned from the API)
    const newTransfer: Transfer = {
      id: 'tr' + Math.floor(1000 + Math.random() * 9000),
      recipient: selectedBeneficiary?.name || '',
      recipientAccount: maskedAccount,
      amount: parseFloat(this.transferForm.get('amount')?.value),
      date: new Date(),
      purpose: this.transferForm.get('purpose')?.value,
      status: 'pending',
      reference: this.transferForm.get('reference')?.value || `REF${Math.floor(100000 + Math.random() * 900000)}`
    };
    
    this.transfers.unshift(newTransfer);
  }

  closeConfirmation(): void {
    this.showConfirmation = false;
    this.transferForm.reset();
    this.selectedBeneficiary = null;
  }
}