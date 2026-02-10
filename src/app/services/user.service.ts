import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface User {
  benutzer_id: string;
  kennwort: string;
  name: string;
  ablaufdatum: string;
  isActive: boolean;
  rolle: string;
}

type BackendUser = Omit<User, 'isActive'> & { isActive: string };

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly baseUrl = 'http://bsc-s-webserver.bsc-intern.de:8080';
  private readonly adminUsersUrl = `${this.baseUrl}/users/admin`;
  private readonly allUsersUrl = `${this.adminUsersUrl}/all_users`;

  constructor(private http: HttpClient) { }

  // Benutzerliste holen (ohne Auth-Header)
  getUsers(): Observable<User[]> {
    return this.http.get<{ users_liste: BackendUser[]; success?: boolean; text?: string }>(this.allUsersUrl, {
      headers: new HttpHeaders({ accept: '*/*' })
    }).pipe(
      map(response => {
        const list = Array.isArray(response?.users_liste) ? response.users_liste : [];
        return list.map(u => ({
          ...u,
          isActive: String(u.isActive).toLowerCase() === 'true'
        }));
      }),
      tap(() => console.log('Benutzerliste abgerufen:', this.allUsersUrl)),
      catchError((error) => {
        console.error('Fehler beim Abrufen der Benutzerliste:', error);
        return throwError(() => new Error('Benutzerliste konnte nicht geladen werden.'));
      })
    );
  }

  // neue Benutzer erstellen (falls Backend später Auth braucht, hier Header ergänzen)
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.adminUsersUrl, user).pipe(
      catchError(err => {
        console.error('Fehler beim Erstellen des Benutzers:', err);
        return throwError(() => new Error('Benutzer konnte nicht erstellt werden.'));
      })
    );
  }

  // bestehende Benutzer aktualisieren
  updateUser(user: User): Observable<User> {
    if (!user?.benutzer_id) {
      return throwError(() => new Error('Benutzer-ID fehlt.'));
    }
    return this.http.put<User>(`${this.adminUsersUrl}/${encodeURIComponent(user.benutzer_id)}`, user).pipe(
      catchError(err => {
        console.error('Fehler beim Aktualisieren des Benutzers:', err);
        return throwError(() => new Error('Benutzer konnte nicht aktualisiert werden.'));
      })
    );
  }

  // Benutzer löschen
  deleteUser(userId: string): Observable<void> {
    if (!userId) {
      return throwError(() => new Error('Benutzer-ID fehlt.'));
    }
    return this.http.delete<void>(`${this.adminUsersUrl}/${encodeURIComponent(userId)}`).pipe(
      catchError(err => {
        console.error('Fehler beim Löschen des Benutzers:', err);
        return throwError(() => new Error('Benutzer konnte nicht gelöscht werden.'));
      })
    );
  }
}
