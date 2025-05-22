import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private router: Router) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Version simplifiée qui autorise toujours l'accès pendant le développement
    console.log('AuthGuard: Access granted for development purposes');
    
    // Vous pouvez également logger les informations sur la route pour le débogage
    console.log('Route path:', route.routeConfig?.path);
    console.log('Required role:', route.data['role']);
    
    return true;
  }
}