import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { NavButton, NavBlockComponent } from '../../components/nav-block/nav-block.component';
import { SlotService } from '../../services/api/slot.service';
import { Slot, SlotSearchCriteria, CreateSlotRequest, EditSlotRequest } from '../../services/api/slot.interface';
import { Subject, takeUntil, debounceTime } from 'rxjs';

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
export class StellplatzverwaltungComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  searchTerm: string = '';
  selectedFilialCode: string = 'TOP'; // Standard FilialCode

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

  // Alle Slots (gefiltert)
  allFilteredSlots: Slot[] = [];
  // Angezeigte Slots (paginiert)
  displayedSlots: Slot[] = [];
  navButtons: NavButton[] = [];

  // Loading State
  isLoading: boolean = false;
  loadingMessage: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalItems: number = 0;
  totalPages: number = 1;

  // Modal States
  showDeleteConfirm: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  slotToDelete: Slot | null = null;
  slotToEdit: Slot | null = null;
  newSlot: CreateSlotRequest = this.getEmptySlot();
  editSlot: EditSlotRequest = this.getEmptyEditSlot();

  constructor(
    private router: Router,
    private authService: AuthService,
    private navigationService: NavigationService,
    private slotService: SlotService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
    this.setupFilterDebounce();
    this.loadSlots();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterDebounce(): void {
    // Debounce Filter-Änderungen um Performance zu verbessern
    this.filterChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private loadNavigation(): void {
    this.navigationService.getNavButtons('/stellplatzverwaltung').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  /**
   * Lädt alle Slots für den ausgewählten FilialCode
   */
  loadSlots(): void {
    this.isLoading = true;
    this.loadingMessage = 'Lade Stellplätze...';

    this.slotService.getAllSlotsByFcode(this.selectedFilialCode).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (slots) => {
        console.log('Slots geladen:', slots.length); // DEBUG
        this.isLoading = false;
        this.loadingMessage = '';
        this.applyFilters();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadingMessage = '';
        console.error('Fehler beim Laden:', err);
      }
    });
  }

  /**
   * Wird bei Filter-Änderungen aufgerufen (mit Debounce)
   */
  onFilterChange(): void {
    this.filterChange$.next();
  }

  /**
   * Wendet alle Filter an und paginiert die Ergebnisse
   */
  applyFilters(): void {
    // SearchCriteria aus Filtern erstellen
    const criteria: SlotSearchCriteria = {
      searchTerm: this.searchTerm || undefined,
      regalnummer: this.filters.regalNr || undefined,
      filialcode: this.filters.filialCode || undefined,
      artikelnummer: this.filters.artikelNr || undefined,
      vintageyear: this.filters.jahrgang || undefined,
      ist_kommiplatz: this.parseBoolFilter(this.filters.kPlatz),
      locked: this.parseBoolFilter(this.filters.gesperrt),
      _bio: this.parseBoolFilter(this.filters.bio),
      liquor: this.parseBoolFilter(this.filters.hochProzent),
      orderarticle: this.parseBoolFilter(this.filters.bestellartikelplatz),
      tax: this.parseBoolFilter(this.filters.steuer)
    };

    // Filter anwenden
    this.allFilteredSlots = this.slotService.searchSlots(this.selectedFilialCode, criteria);
    console.log('Gefilterte Slots:', this.allFilteredSlots.length); // DEBUG

    // Pagination anwenden
    this.currentPage = 1; // Bei neuen Filtern zur ersten Seite
    this.updatePagination();
  }

  /**
   * Parst String zu Boolean oder null
   */
  private parseBoolFilter(value: string): boolean | null {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === 'ja' || lower === '1' || lower === 'true' || lower === 'j') return true;
    if (lower === 'nein' || lower === '0' || lower === 'false' || lower === 'n') return false;
    return null;
  }

  /**
   * Aktualisiert die Pagination
   */
  private updatePagination(): void {
    const result = this.slotService.paginateSlots(this.allFilteredSlots, this.currentPage, this.pageSize);
    this.displayedSlots = result.data;
    this.totalItems = result.totalItems;
    this.totalPages = result.totalPages;
  }

  /**
   * Filter zurücksetzen
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
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
    this.applyFilters();
  }

  /**
   * Cache aktualisieren
   */
  refreshData(): void {
    this.slotService.clearCache(this.selectedFilialCode);
    this.loadSlots();
  }

  /**
   * FilialCode wurde geändert - Daten neu laden
   */
  onFilialCodeChange(): void {
    if (this.selectedFilialCode.trim()) {
      this.selectedFilialCode = this.selectedFilialCode.toUpperCase().trim();
      this.loadSlots();
    }
  }

  navigateToHome(): void {
    this.router.navigate(['home']);
  }

  // Pagination Methoden
  goToFirstPage(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
    this.updatePagination();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  logout() {
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ========== Slot hinzufügen ==========
  getEmptySlot(): CreateSlotRequest {
    return {
      regalnummer: '',
      filialcode: this.selectedFilialCode || 'TOP',
      artikelnummer: '',
      vintageyear: '',
      charge: '',
      ist_kommiplatz: false,
      height: '',
      width: '',
      depth: '',
      nve: '',
      amountbase: 0,
      amount: 0,
      unit: '',
      amountunit: 0,
      tax: false,
      locked: false,
      _bio: false,
      liquor: false,
      orderarticle: false,
      pals: '',
      ist_aktiv: true
    };
  }

  getEmptyEditSlot(): EditSlotRequest {
    return {
      regalnummer: '',
      filialcode: this.selectedFilialCode || 'TOP',
      artikelnummer: '',
      vintageyear: '',
      charge: '',
      ist_kommiplatz: false,
      height: '',
      width: '',
      depth: '',
      nve: '',
      amountbase: 0,
      amount: 0,
      unit: '',
      amountunit: 0,
      tax: false,
      locked: false,
      is_bio: false,
      liquor: false,
      orderarticle: false,
      pals: '',
      ist_aktiv: true,
      createdat: '',
      createdby: '',
      updatedat: '',
      updatedby: ''
    };
  }

  openAddModal(): void {
    this.newSlot = this.getEmptySlot();
    this.showAddModal = true;
  }

  cancelAdd(): void {
    this.showAddModal = false;
  }

  executeAdd(): void {
    if (!this.newSlot.regalnummer) {
      alert('Regalnummer ist erforderlich');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Speichere Stellplatz...';

    this.slotService.addSlot(this.newSlot).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loadingMessage = '';
        if (response.success) {
          this.showAddModal = false;
          this.refreshData();
        } else {
          alert('Fehler: ' + response.msg);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadingMessage = '';
        const errorMsg = err.error?.msg || err.error?.error || err.message;
        alert('Fehler beim Speichern: ' + errorMsg);
      }
    });
  }

  // ========== Slot löschen ==========
  confirmDelete(slot: Slot): void {
    this.slotToDelete = slot;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.slotToDelete = null;
    this.showDeleteConfirm = false;
  }

  executeDelete(): void {
    if (!this.slotToDelete) return;

    const regalNr = this.slotToDelete.regalnummer;

    // Modal sofort schließen
    this.showDeleteConfirm = false;
    this.slotToDelete = null;

    this.isLoading = true;
    this.loadingMessage = 'Lösche Stellplatz...';

    this.slotService.deleteSlot(regalNr).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loadingMessage = '';
        if (response.success) {
          this.refreshData();
        } else {
          alert('Fehler: ' + response.msg);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadingMessage = '';
        const errorMsg = err.error?.msg || err.error?.error || err.message;
        alert('Fehler beim Löschen: ' + errorMsg);
      }
    });
  }

  // ========== Slot bearbeiten ==========
  openEditModal(slot: Slot): void {
    this.slotToEdit = slot;
    this.editSlot = {
      regalnummer: slot.regalnummer,
      filialcode: slot.filialcode,
      artikelnummer: slot.artikelnummer,
      vintageyear: slot.vintageyear,
      charge: slot.charge,
      ist_kommiplatz: slot.ist_kommiplatz,
      height: slot.height,
      width: slot.width,
      depth: slot.depth,
      nve: slot.nve,
      amountbase: slot.amountbase,
      amount: slot.amount,
      unit: slot.unit,
      amountunit: slot.amountunit,
      tax: slot.tax,
      locked: slot.locked,
      is_bio: slot._bio,
      liquor: slot.liquor,
      orderarticle: slot.orderarticle,
      pals: slot.pals,
      ist_aktiv: slot.ist_aktiv,
      createdat: slot.createdat,
      createdby: slot.createdby,
      updatedat: new Date().toISOString().split('T')[0],
      updatedby: localStorage.getItem('username') || ''
    };
    this.showEditModal = true;
  }

  cancelEdit(): void {
    this.slotToEdit = null;
    this.showEditModal = false;
  }

  executeEdit(): void {
    if (!this.editSlot.regalnummer) {
      alert('Regalnummer ist erforderlich');
      return;
    }

    // Modal sofort schließen
    this.showEditModal = false;
    this.slotToEdit = null;

    this.isLoading = true;
    this.loadingMessage = 'Aktualisiere Stellplatz...';

    this.slotService.editSlot(this.editSlot).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loadingMessage = '';
        if (response.success) {
          this.refreshData();
        } else {
          alert('Fehler: ' + response.msg);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadingMessage = '';
        const errorMsg = err.error?.msg || err.error?.error || err.message;
        alert('Fehler beim Aktualisieren: ' + errorMsg);
      }
    });
  }
}
