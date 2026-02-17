import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { NavButton, NavBlockComponent } from '../../components/nav-block/nav-block.component';

export interface StellplatzFilter {
  regalNr: string;
  filialCode: string;
  artikelNr: string;
  jahrgang: string;
  mhd: string;
  kPlatz: string;
  hoehe: string;
  breite: string;
  tiefe: string;
  nve: string;
  gesamtmenge: string;
  menge: string;
  einheit: string;
  mengeEinheit: string;
  steuer: string;
  gesperrt: string;
  bio: string;
  hochProzent: string;
  bestellartikelplatz: string;
  paletten: string;
}

export interface StellplatzData {
  regalNr: string;
  filialCode: string;
  artikelNr: string;
  jahrgang: string;
  mhd: string;
  kPlatz: string;
  hoehe: string;
  breite: string;
  tiefe: string;
  nve: string;
  gesamtmenge: string;
  menge: string;
  einheit: string;
  mengeEinheit: string;
  steuer: string;
  gesperrt: string;
  bio: string;
  hochProzent: string;
  bestellartikelplatz: string;
  paletten: string;
}

@Component({
  selector: 'app-stellplatzverwaltung',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatIconModule,
    HeaderComponent,
    FusszeileComponent,
    NavBlockComponent],
  templateUrl: './stellplatzverwaltung.component.html',
  styleUrls: ['./stellplatzverwaltung.component.scss']
})
export class StellplatzverwaltungComponent implements OnInit {
  searchTerm: string = '';

  filters: StellplatzFilter = {
    regalNr: '',
    filialCode: '',
    artikelNr: '',
    jahrgang: '',
    mhd: '',
    kPlatz: '',
    hoehe: '',
    breite: '',
    tiefe: '',
    nve: '',
    gesamtmenge: '',
    menge: '',
    einheit: '',
    mengeEinheit: '',
    steuer: '',
    gesperrt: '',
    bio: '',
    hochProzent: '',
    bestellartikelplatz: '',
    paletten: ''
  };

  // Beispieldaten für die Tabelle (leer, wird später befüllt)
  tableData: StellplatzData[] = [];
  navButtons: NavButton[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private router: Router,
    private authService: AuthService,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
  }

  private loadNavigation(): void {
    this.navigationService.getNavButtons('/stellplatzverwaltung').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  navigateToHome(): void {
    this.router.navigate(['home']);
  }

  // Pagination Methoden
  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
  }

  logout() {
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
