import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, serverTimestamp, query, orderBy } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MockDataService } from '../mock/mock-data.service';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private useMock = !!environment.useMock;
  private mock = this.useMock ? inject(MockDataService) : null;
  private firestore = this.useMock ? (null as unknown as Firestore) : inject(Firestore);

  listAccounts(): Observable<any[]> {
    if (this.useMock && this.mock) return this.mock.listAccounts();
    const col = collection(this.firestore, 'accounts');
    const q = query(col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  createAccount(account: any) {
    if (this.useMock && this.mock) return this.mock.createAccount(account);
    const col = collection(this.firestore, 'accounts');
    return from(addDoc(col, { ...account, createdAt: serverTimestamp() }));
  }
}
