import { Transaction } from './transaction';
import { Transfer } from './transfer.model';

export interface TransactionVerification {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'transfer' | 'refund' | 'other';
  typeLabel: string;
  status: 'pending' | 'flagged' | 'success' | 'failed' | 'cancelled' | 'completed';
  clientName: string;
  clientId: string;
  accountNumber: string;
  accountId?: string; // Pour compatibilité avec le reste de l'application
  recipient?: string;
  recipientAccount?: string;
  recipientName?: string; // Alias pour recipient, pour compatibilité
  recipientAccountId?: string; // Alias pour recipientAccount, pour compatibilité
  description?: string;
  reference?: string;
  merchantName?: string; // Pour les paiements
  category?: string; // Catégorie de transaction
  balanceAfterTransaction?: number; // Solde après transaction
  verifier?: string;
  flaggedReason?: string;
  
  // Champs supplémentaires pour le tracking
  agentId?: string;
  verificationDate?: Date;
  verificationNote?: string;
  name?: string; // Nom de la transaction, souvent utilisé dans l'UI
}

export interface TransactionFilter {
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  type?: string;
  amountMin?: number;
  amountMax?: number;
}

// Mapper des transactions existantes vers le modèle de vérification
export function mapTransactionToVerification(
  transaction: Transaction,
  clientName: string
): TransactionVerification {
  return {
    id: transaction.id,
    date: transaction.date,
    amount: transaction.amount,
    currency: transaction.currency,
    type: transaction.type,
    typeLabel: getTypeLabel(transaction.type),
    status: mapStatus(transaction.status),
    clientName: clientName,
    clientId: transaction.accountId,
    accountId: transaction.accountId, // Pour compatibilité
    accountNumber: transaction.accountId,
    recipient: transaction.recipientName,
    recipientName: transaction.recipientName, // Alias pour compatibilité
    recipientAccount: transaction.recipientAccountId,
    recipientAccountId: transaction.recipientAccountId, // Alias pour compatibilité
    description: transaction.description,
    reference: transaction.reference,
    merchantName: transaction.merchantName,
    category: transaction.category,
    balanceAfterTransaction: transaction.balanceAfterTransaction,
    name: transaction.name, // Pour l'UI
    verifier: undefined,
    flaggedReason: undefined
  };
}

export function mapTransferToVerification(
  transfer: Transfer,
  clientName: string
): TransactionVerification {
  return {
    id: transfer.id,
    date: transfer.createdAt,
    amount: transfer.amount,
    currency: transfer.currency,
    type: 'transfer',
    typeLabel: 'Virement',
    status: mapStatus(transfer.status),
    clientName: clientName,
    clientId: transfer.senderAccountId,
    accountId: transfer.senderAccountId, // Pour compatibilité
    accountNumber: transfer.senderAccountNumber || transfer.senderAccountId,
    recipient: transfer.recipientName,
    recipientName: transfer.recipientName, // Alias pour compatibilité
    recipientAccount: transfer.recipientAccountNumber,
    recipientAccountId: transfer.recipientAccountNumber, // Alias pour compatibilité
    description: transfer.reason,
    reference: transfer.reference,
    name: `Virement à ${transfer.recipientName}`, // Nom pour l'UI
    verifier: undefined,
    flaggedReason: undefined
  };
}

/**
 * Obtient le libellé descriptif pour un type de transaction
 */
export function getTypeLabel(type: string): string {
  switch (type) {
    case 'transfer': return 'Virement';
    case 'payment': return 'Paiement';
    case 'withdrawal': return 'Retrait';
    case 'deposit': return 'Dépôt';
    case 'refund': return 'Remboursement';
    default: return 'Autre';
  }
}

/**
 * Convertit un statut de transaction vers le format de vérification
 */
export function mapStatus(status: string): 'pending' | 'flagged' | 'success' | 'failed' | 'cancelled' | 'completed' {
  switch (status) {
    case 'pending': return 'pending';
    case 'completed': return 'completed';
    case 'success': return 'success';
    case 'failed': return 'failed';
    case 'cancelled': return 'cancelled';
    case 'flagged': return 'flagged';
    default: return 'pending';
  }
}

/**
 * Crée un objet de transaction de vérification à partir de données partielles
 * Utile pour créer des objets de test ou compléter des données incomplètes
 */
export function createVerificationTransaction(partial: Partial<TransactionVerification>): TransactionVerification {
  return {
    id: partial.id || `tx-${Date.now()}`,
    date: partial.date || new Date(),
    amount: partial.amount || 0,
    currency: partial.currency || 'MAD',
    type: partial.type || 'other',
    typeLabel: partial.typeLabel || getTypeLabel(partial.type || 'other'),
    status: partial.status || 'pending',
    clientName: partial.clientName || 'Client',
    clientId: partial.clientId || 'unknown',
    accountNumber: partial.accountNumber || partial.accountId || 'unknown',
    accountId: partial.accountId || partial.accountNumber || 'unknown',
    recipient: partial.recipient || partial.recipientName,
    recipientName: partial.recipientName || partial.recipient,
    recipientAccount: partial.recipientAccount || partial.recipientAccountId,
    recipientAccountId: partial.recipientAccountId || partial.recipientAccount,
    description: partial.description,
    reference: partial.reference,
    merchantName: partial.merchantName,
    name: partial.name || `Transaction ${partial.id || Date.now().toString()}`,
    category: partial.category,
    balanceAfterTransaction: partial.balanceAfterTransaction,
    verifier: partial.verifier,
    agentId: partial.agentId,
    verificationDate: partial.verificationDate,
    verificationNote: partial.verificationNote,
    flaggedReason: partial.flaggedReason
  };
}