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

// Interface für Backend-Request beim Erstellen eines neuen Benutzers
export interface CreateUserRequest {
  username: string;
  password: string;
  aktiv: string;  // "true" oder "false"
  name: string;
  rolle: string;
}

// Interface für Backend-Request beim Bearbeiten eines Benutzers
export interface EditUserRequest {
  username: string;
  password?: string;  // Optional - nur wenn Passwort geändert werden soll
  aktiv: string;      // "true" oder "false"
  name: string;
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
  private readonly addUserUrl = `${this.adminUsersUrl}/add_user`;
  private readonly editUserUrl = `${this.adminUsersUrl}/edit_user`;

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

  // neue Benutzer erstellen - ALTE METHODE (auskommentiert)
  // createUser(user: User): Observable<User> {
  //   return this.http.post<User>(this.adminUsersUrl, user).pipe(
  //     catchError(err => {
  //       console.error('Fehler beim Erstellen des Benutzers:', err);
  //       return throwError(() => new Error('Benutzer konnte nicht erstellt werden.'));
  //     })
  //   );
  // }

  // Neue Benutzer erstellen mit korrektem Backend-Schema
  createUser(userData: CreateUserRequest): Observable<any> {
    return this.http.post<any>(this.addUserUrl, userData, {
      headers: new HttpHeaders({
        'accept': 'application/json',
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => console.log('Benutzer erstellt:', response)),
      catchError(err => {
        console.error('Fehler beim Erstellen des Benutzers:', err);
        return throwError(() => new Error('Benutzer konnte nicht erstellt werden.'));
      })
    );
  }

  // bestehende Benutzer aktualisieren
  updateUser(user: User, newPassword?: string): Observable<any> {
    if (!user?.benutzer_id) {
      return throwError(() => new Error('Benutzer-ID fehlt.'));
    }

    const editRequest: EditUserRequest = {
      username: user.benutzer_id,
      name: user.name,
      rolle: user.rolle,
      aktiv: user.isActive ? 'true' : 'false'
    };

    // Passwort nur senden wenn es geändert werden soll
    if (newPassword) {
      editRequest.password = newPassword;
    }

    return this.http.post<any>(this.editUserUrl, editRequest, {
      headers: new HttpHeaders({
        'accept': '*/*',
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap(response => console.log('Benutzer aktualisiert:', response)),
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
