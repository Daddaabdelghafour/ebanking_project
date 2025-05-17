export interface AlertSettings {
  id: string;
  clientId: string;
  balanceBelow?: number;
  largeTransactions?: number;
  loginNewDevice: boolean;
  suspiciousActivity: boolean;
  newStatement: boolean;
  paymentDue: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AlertNotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface AlertPreference {
  type: AlertType;
  description: string;
  enabled: boolean;
  channels: AlertNotificationChannel;
  threshold?: number;
}

export type AlertType = 
  | 'balance_below'
  | 'large_transaction'
  | 'login_new_device'
  | 'suspicious_activity'
  | 'new_statement'
  | 'payment_due';