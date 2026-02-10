
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { Location } from '@angular/common';
import { AuthServiceInterface, UserDetails, EditUserResponse } from '../services/auth.service.interface'; // Pfad ggf. anpassen
import { HttpClient } from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})
export class AuthService implements CanActivate, AuthServiceInterface {
  constructor(
    private router: Router,
    private location: Location,
    private http: HttpClient
  ) {
    //this.checkForMyPageReload();
  }
  private username: string | null = null;

  setUsername(name: string) {
    this.username = name;
    localStorage.setItem('username', name); // optional: für Reloads
  }
  getUsername(): string | null {
    if (!this.username) {
      this.username = localStorage.getItem('username');
    }
    return this.username;
  }

  /*private checkForMyPageReload(): void {
    if (this.location.path() === '') {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry.type === 'reload') {
        console.log('Es ist ein echter Reload:', navigationEntry.type);
        this.logout();
      }
    }
  }

  canActivate(): boolean {
    const jsessionid = localStorage.getItem('JSESSIONID');
    if (jsessionid) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }*/
  canActivate(): boolean {
    const jsessionid = localStorage.getItem('JSESSIONID');
    if (jsessionid) {
      // Benutzer ist eingeloggt, Zugriff erlauben
      return true;
    } else {
      // Benutzer ist nicht eingeloggt, Umleitung zur Login-Seite
      this.router.navigate(['/login']);
      return false;
    }
  }

  logout(): void {
    this.username = null;
    localStorage.removeItem('username');
    console.log('Logout aufgerufen');
    localStorage.removeItem('JSESSIONID');
    localStorage.removeItem('pageReloaded');
    if (this.location.path() !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  // Jetzt kommt die echte login()-Methode, die vom Interface gefordert ist:
  login(user: UserDetails): Observable<EditUserResponse> {
    return this.http.post<EditUserResponse>('http://bsc-s-webserver.bsc-intern.de:8080/users/get_permission', user);
  }
}
