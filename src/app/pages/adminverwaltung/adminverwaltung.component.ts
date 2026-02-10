import { Component, OnInit } from '@angular/core';
import { LayoutComponent } from '../../components/layout/layout.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NachrichtenService } from '../../services/nachrichten.service';
import { MatIcon } from '@angular/material/icon';
import { User, UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
//import { HeaderComponent } from '../../components/header/header.component';




@Component({
  selector: 'app-adminverwaltung',
  standalone: true,
  imports: [LayoutComponent, MatIcon, CommonModule],
  templateUrl: './adminverwaltung.component.html',
  styleUrls: ['./adminverwaltung.component.scss']
})
export class AdminverwaltungComponent implements OnInit {
  zeigeNachrichten: boolean = false;
  users: User[] = [];

  // Pagination
  pageSize = 7;
  currentPage = 1;
  pagedUsers: User[] = [];
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.users.length / this.pageSize));
  }
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  constructor(public router: Router, private authService: AuthService, public nachrichtenService: NachrichtenService, private userService: UserService) { }

  ngOnInit(): void {
    this.nachrichtenService.sichtbar$.subscribe(val => this.zeigeNachrichten = val);
    // this.checkSession();
    this.loadUsers();
  }
  /*
    checkSession(): void {
  
      const jsessionid = localStorage.getItem('JSESSIONID')
  
      if (!jsessionid) {
        this.authService.logout();
  
      }
  
    }
  */
  logout() {
    //localStorage.setItem('username', 'Peter')
    //alert(this.username);
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }



  // Holt die Benutzerliste aus dem Backend
  loadUsers(): void {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
      this.updatePagedUsers();
    });
  }

  private updatePagedUsers(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedUsers = this.users.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedUsers();
  }

  // Erstellt einen neuen Benutzer
  addUser(): void {
    const newUser: User = {
      benutzer_id: '0',
      name: 'neuerBenutzer',
      kennwort: '',
      ablaufdatum: new Date().toISOString(),
      isActive: true,
      rolle: 'base'
    };
    this.userService.createUser(newUser).subscribe(() => {
      this.loadUsers(); // Aktualisiert die Liste nach dem Hinzufügen
    });
  }

  // Bearbeitet einen bestehenden Benutzer
  editUser(user: User): void {
    const updatedRoles = prompt(`Bearbeiten Sie die Rollen für ${user.name} (getrennt durch Kommas):`, user.rolle);
    if (updatedRoles) {
      user.rolle = updatedRoles.split(',').map((role) => role.trim()).join(',');
      this.userService.updateUser(user).subscribe(() => {
        this.loadUsers(); // Aktualisiert die Liste nach der Bearbeitung
      });
    }
  }

  // Löscht einen Benutzer
  deleteUser(user: User): void {
    const confirmDelete = confirm(`Möchten Sie ${user.name} wirklich löschen?`);
    if (confirmDelete) {
      this.userService.deleteUser(user.benutzer_id).subscribe(() => {
        this.loadUsers(); // Aktualisiert die Liste nach dem Löschen
      });
    }
  }
}
