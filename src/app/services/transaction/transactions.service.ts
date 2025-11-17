import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MockDataService } from '../mock/mock-data.service';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private useMock = !!environment.useMock;
  private mock = this.useMock ? inject(MockDataService) : null;
  private firestore = this.useMock ? (null as unknown as Firestore) : inject(Firestore);

  listTransactionsForAccount(accountId: string): Observable<any[]> {
    if (this.useMock && this.mock) return this.mock.listTransactionsForAccount(accountId);
    const col = collection(this.firestore, 'transactions');
    const q = query(col, where('accountId', '==', accountId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  createTransaction(tx: any) {
    if (this.useMock && this.mock) return this.mock.createTransaction(tx);
    const col = collection(this.firestore, 'transactions');
    return from(addDoc(col, { ...tx, createdAt: serverTimestamp() }));
  }
}
