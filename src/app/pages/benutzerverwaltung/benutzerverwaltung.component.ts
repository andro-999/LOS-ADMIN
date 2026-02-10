import { Component, NgModule, OnInit } from '@angular/core';
import { UserService, User } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { LayoutComponent } from '../../components/layout/layout.component';


@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  templateUrl: './benutzerverwaltung.component.html',
  styleUrls: ['./benutzerverwaltung.component.scss'],
  imports: [CommonModule, MatIconModule, HeaderComponent, SidebarComponent, LayoutComponent]
})
export class BenutzerverwaltungComponent implements OnInit {
  users: User[] = [];

  constructor(private userService: UserService) { }

  @NgModule({
    declarations: [
      BenutzerverwaltungComponent
    ],

  })

  ngOnInit(): void {
    this.loadUsers();
  }

  // Holt die Benutzerliste aus dem Backend
  loadUsers(): void {
    this.userService.getUsers().subscribe((data) => {
      this.users = data;
    });
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
