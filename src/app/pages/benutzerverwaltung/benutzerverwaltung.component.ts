import { Component, OnInit } from '@angular/core'; // NgModule nicht mehr benötigt
import { UserService, User, CreateUserRequest } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../components/header/header.component';
import { Router } from '@angular/router';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-benutzerverwaltung',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    HeaderComponent,
    NavBlockComponent,
    FusszeileComponent
  ],
  templateUrl: './benutzerverwaltung.component.html',
  styleUrls: ['./benutzerverwaltung.component.scss']
})
export class BenutzerverwaltungComponent implements OnInit {
  users: User[] = [];
  navButtons: NavButton[] = [];
  filteredUsers: User[] = [];
  selectedRole: string = '';
  availableRoles: string[] = []; // Neue Property für verfügbare Rollen

  // Formular-Anzeige und Daten
  showAddUserForm: boolean = false;
  newUserData: CreateUserRequest = {
    username: '',
    password: '',
    aktiv: 'true',
    name: '',
    rolle: 'base'
  };

  constructor(
    private userService: UserService,
    private router: Router,
    private navigationService: NavigationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
    this.loadUsers();
  }

  loadNavigation(): void {
    this.navigationService.getNavButtons('/benutzerverwaltung').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  // Holt die Benutzerliste aus dem Backend
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        console.log('Geladene Benutzer:', this.users.length);

        // Extrahiere alle einzigartigen Rollen aus den Benutzerdaten
        this.updateAvailableRoles();

        // Filter anwenden nach dem Laden
        this.filterUser();
        // Aktualisiere Navigation nach dem Laden
        this.navigationService.refreshCounts();
      },
      error: (err) => {
        console.error('Fehler beim Laden der Benutzer:', err);
      }
    });
  }
  changePassword(user: User): void {
    const newPassword = prompt(`Geben Sie das neue Passwort ein für ${user.name}:`, '');
    if (newPassword && newPassword.trim()) {
      this.userService.updateUser(user, newPassword.trim()).subscribe({
        next: () => {
          alert('Passwort erfolgreich geändert!');
          this.loadUsers();
        },
        error: (err) => {
          alert('Fehler beim Ändern des Passworts: ' + err.message);
        }
      });
    }
  }

  updateAvailableRoles(): void {
    const roles = this.users.map(user => user.rolle).filter(rolle => rolle);
    this.availableRoles = [...new Set(roles)].sort();
    console.log('Verfügbare Rollen:', this.availableRoles);
  }

  // Zeigt das Formular zum Erstellen eines neuen Benutzers
  addUser(): void {
    console.log('addUser() aufgerufen - Formular wird angezeigt');
    this.showAddUserForm = true;
    console.log('showAddUserForm gesetzt auf:', this.showAddUserForm);
    // Formular zurücksetzen
    this.newUserData = {
      username: '',
      password: '',
      aktiv: 'true',
      name: '',
      rolle: 'base'
    };
  }

  // Sendet die Formulardaten zum Backend
  submitNewUser(): void {
    // Validierung
    if (!this.newUserData.username || !this.newUserData.password ||
      !this.newUserData.name || !this.newUserData.rolle) {
      alert('Bitte alle Felder ausfüllen!');
      return;
    }

    this.userService.createUser(this.newUserData).subscribe({
      next: () => {
        this.loadUsers();
        alert('Benutzer erfolgreich erstellt!');
        this.showAddUserForm = false;
      },
      error: (err) => {
        alert('Fehler beim Erstellen: ' + err.message);
      }
    });
  }

  // Bricht die Benutzererstellung ab
  cancelAddUser(): void {
    this.showAddUserForm = false;
    this.newUserData = {
      username: '',
      password: '',
      aktiv: 'true',
      name: '',
      rolle: 'base'
    };
  }


  // Bearbeitet einen bestehenden Benutzer
  editUser(user: User): void {
    const updatedRoles = prompt(`Bearbeiten Sie die Rollen für ${user.name} (getrennt durch Kommas):`, user.rolle);
    if (updatedRoles) {
      user.rolle = updatedRoles.split(',').map((role) => role.trim()).join(',');
      this.userService.updateUser(user).subscribe({
        next: () => {
          alert('Rolle erfolgreich geändert!');
          this.loadUsers();
        },
        error: (err) => {
          alert('Fehler beim Ändern der Rolle: ' + err.message);
        }
      });
    }
  }
  navigateToLeitstand(): void {
    this.router.navigate(['/leitstand']);

  }
  navigateToBenutzerverwaltung(): void {
    this.router.navigate(['/benutzerverwaltung']);
  }
  navigateToAdminverwaltung(): void {
    this.router.navigate(['/adminverwaltung']);
  }


  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  logout() {
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  filterUser(): void {
    if (!this.selectedRole) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.rolle.toLocaleLowerCase() === this.selectedRole.toLocaleLowerCase()
      );
    }
  }
  clearFilter(): void {
    this.selectedRole = '';
    this.filterUser();
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
