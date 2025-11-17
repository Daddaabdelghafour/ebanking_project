import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockDataService } from '../mock/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private useMock = !!environment.useMock;
  private mock = this.useMock ? inject(MockDataService) : null;
  private auth = this.useMock ? (null as unknown as Auth) : inject(Auth);

  currentUser$(): Observable<any> {
    if (this.useMock && this.mock) return this.mock.getCurrentUser$();
    return authState(this.auth);
  }

  signUp(email: string, password: string): Observable<any> {
    if (this.useMock && this.mock) return this.mock.signUp(email, password);
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      map(result => result.user)
    );
  }

  signIn(email: string, password: string): Observable<any> {
    if (this.useMock && this.mock) return this.mock.signIn(email, password);
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(result => result.user)
    );
  }

  signOut(): Observable<void> {
    if (this.useMock && this.mock) return this.mock.signOut();
    return from(signOut(this.auth));
  }

  async getIdToken(): Promise<string | null> {
    if (this.useMock && this.mock) return this.mock.getIdToken();
    const user = this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }
}