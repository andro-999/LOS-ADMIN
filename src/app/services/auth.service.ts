
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { from, Observable, firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { AuthServiceInterface, UserDetails, EditUserResponse } from '../services/auth.service.interface'; // Pfad ggf. anpassen
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';



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

  async logout(): Promise<void> {
    try {
      const logoutUrl = `${environment.apiUrl}/logout`;
      await firstValueFrom(this.http.get(logoutUrl));
      console.log('Backend-Logout erfolgreich (JSESSIONID gelöscht)');
    } catch (err) {
      console.warn('Backend-Logout fehlgeschlagen:', err);
    }

    this.username = null;
    localStorage.removeItem('username');
    localStorage.removeItem('JSESSIONID');
    localStorage.removeItem('pageReloaded');
    console.log('Logout aufgerufen');

    if (this.location.path() !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  // Jetzt kommt die echte login()-Methode, die vom Interface gefordert ist:
  login(user: UserDetails): Observable<EditUserResponse> {
    return this.http.post<EditUserResponse>(`${environment.apiUrl}/users/get_permission`, user);
  }
}
