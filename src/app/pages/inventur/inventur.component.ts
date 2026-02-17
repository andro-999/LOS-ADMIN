import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { NavBlockComponent } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';
import { NavButton } from '../../components/nav-block/nav-block.component';
import { BereichNavComponent, BereichNavItem } from '../../components/bereich-nav/bereich-nav.component';
import { AuthService } from '../../services/auth.service';
import { MatIcon } from '@angular/material/icon';
import { InventurService, InventurTaskResponse, BestandskontrolleResponse } from './inventur.service';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';


@Component({
  selector: 'app-inventur',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, NavBlockComponent, MatIcon, BereichNavComponent, FusszeileComponent],
  templateUrl: './inventur.component.html',
  styleUrls: ['./inventur.component.scss']
})
export class InventurComponent implements OnInit {
  navButtons: NavButton[] = [];
  bereichNavItems: BereichNavItem[] = [
    { id: 'kardex-inventur', label: 'Kardex Inventur' },
    { id: 'inventur', label: 'Inventur' },
    { id: 'bestandskontrolle', label: 'Bestandskontrolle' }
  ];

  // Kardex Inventur Form
  inventurFormData = {
    turmNr: '',
    tablarNr: '',
    boxNr: '',
    column: '',
    row: ''
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';
  lastCreatedTask: InventurTaskResponse | null = null;

  // Bestandskontrolle Form
  bestandskontrolleFormData = {
    artikelnummer: ''
  };

  bestandskontrolleLoading = false;
  bestandskontrolleSuccess = '';
  bestandskontrolleError = '';
  lastBestandskontrolleTask: BestandskontrolleResponse | null = null;

  get bereichText(): string {
    switch (this.currentView) {
      case 'kardex-inventur': return 'Inventur - Kardex Inventur';
      case 'inventur': return 'Inventur - Inventur';
      case 'bestandskontrolle': return 'Inventur - Bestandskontrolle';

      default: return 'Inventur';
    }
  }

  constructor(
    public router: Router,
    private authService: AuthService,
    private navigationService: NavigationService,
    private inventurService: InventurService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
  }

  currentView: string = 'kardex-inventur';
  navigateToView(view: 'kardex-inventur' | 'inventur' | 'bestandskontrolle'): void {
    this.currentView = view;
    // this.currentPage = 1; // Reset auf Seite 1

    // Optional: Navigiere auch in der URL, damit es bookmarkbar ist
  }


  loadNavigation(): void {
    this.navigationService.getNavButtons('/inventur').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  logout() {
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Kardex Inventur Methoden
  createInventurTask(): void {
    if (!this.inventurFormData.turmNr || !this.inventurFormData.tablarNr) {
      this.errorMessage = 'Turm Nr. und Tablar Nr. sind Pflichtfelder.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const initiatorid = this.authService.getUsername() || 'UNKNOWN';

    const request = {
      initiatorid: initiatorid,
      turmNr: parseInt(this.inventurFormData.turmNr, 10),
      tablarNr: parseInt(this.inventurFormData.tablarNr, 10),
      boxNr: this.inventurFormData.boxNr ? parseInt(this.inventurFormData.boxNr, 10) : undefined,
      column: this.inventurFormData.column ? parseInt(this.inventurFormData.column, 10) : undefined,
      row: this.inventurFormData.row ? parseInt(this.inventurFormData.row, 10) : undefined
    };

    this.inventurService.createInventurSlot(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.lastCreatedTask = response;
        if (response.success) {
          const regalnummer = response.data.regalnummern?.[0] || '';
          this.successMessage = `Inventur-Aufgabe erfolgreich erstellt: ${regalnummer}`;
          this.resetForm();
        } else {
          this.errorMessage = 'Inventur-Aufgabe konnte nicht erstellt werden.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Ein Fehler ist aufgetreten.';
      }
    });
  }

  resetForm(): void {
    this.inventurFormData = {
      turmNr: '',
      tablarNr: '',
      boxNr: '',
      column: '',
      row: ''
    };
  }

  getInventurTyp(): string {
    const hasBox = !!this.inventurFormData.boxNr;
    const hasColumn = !!this.inventurFormData.column;
    const hasRow = !!this.inventurFormData.row;
    return this.inventurService.getInventurTyp(hasBox, hasColumn, hasRow);
  }

  // Bestandskontrolle Methoden
  createBestandskontrolleTask(): void {
    if (!this.bestandskontrolleFormData.artikelnummer) {
      this.bestandskontrolleError = 'Artikelnummer ist ein Pflichtfeld.';
      return;
    }

    this.bestandskontrolleLoading = true;
    this.bestandskontrolleSuccess = '';
    this.bestandskontrolleError = '';

    const initiatorid = this.authService.getUsername() || 'UNKNOWN';

    const request = {
      initiatorid: initiatorid,
      artikelnummer: this.bestandskontrolleFormData.artikelnummer.trim()
    };

    this.inventurService.createBestandskontrolle(request).subscribe({
      next: (response) => {
        this.bestandskontrolleLoading = false;
        this.lastBestandskontrolleTask = response;
        if (response.success) {
          this.bestandskontrolleSuccess = `Bestandskontrolle erfolgreich erstellt für Artikel: ${response.artikelnummer}`;
          this.resetBestandskontrolleForm();
        } else {
          this.bestandskontrolleError = 'Bestandskontrolle konnte nicht erstellt werden.';
        }
      },
      error: (err) => {
        this.bestandskontrolleLoading = false;
        this.bestandskontrolleError = err.message || 'Ein Fehler ist aufgetreten.';
      }
    });
  }

  resetBestandskontrolleForm(): void {
    this.bestandskontrolleFormData = {
      artikelnummer: ''
    };
  }
}
