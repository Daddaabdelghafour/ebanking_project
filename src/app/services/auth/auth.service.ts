import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any = null;
  
  // Supprimez l'injection de Auth qui n'existe pas
  constructor(
    private http: HttpClient
    // Supprimez cette ligne: private auth: Auth 
  ) {}

  // Reste du service...
  
  // Si vous aviez des méthodes utilisant this.auth, vous devrez les adapter
}