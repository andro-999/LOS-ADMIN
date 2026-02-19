import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
//import { LayoutComponent } from '../../components/layout/layout.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NachrichtenService } from '../../services/nachrichten.service';
import { MatIcon } from '@angular/material/icon';
// import { User, UserService } from '../../services/user.service'; // UNUSED
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeitstandService, Auftrag, EinlagerungTask, KdxRegalplatz } from './leitstand.service';
import { HeaderComponent } from '../../components/header/header.component';
// import { BenutzerverwaltungComponent } from '../benutzerverwaltung/benutzerverwaltung.component'; // UNUSED
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';
import { InventurService, InventurTask } from '../inventur/inventur.service';
import { BereichNavComponent, BereichNavItem } from '../../components/bereich-nav/bereich-nav.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';


@Component({
  selector: 'app-leitstand',
  standalone: true,
  imports: [
    MatIcon,
    CommonModule,
    FormsModule,
    HeaderComponent,
    NavBlockComponent,
    BereichNavComponent,
    FusszeileComponent
  ],
  templateUrl: './leitstand.component.html',
  styleUrls: ['./leitstand.component.scss']
})
export class LeitstandComponent implements OnInit, OnDestroy {

  auftraege: Auftrag[] = [];
  filteredAuftraege: Auftrag[] = [];
  freeAuftraege: Auftrag[] = []; // Aufträge ohne Lagerist
  inventurTasks: InventurTask[] = []; // Inventur-Aufgaben
  isLoadingInventur: boolean = false;
  einlagerungTasks: EinlagerungTask[] = []; // Einlagerungs-Aufgaben
  isLoadingEinlagerung: boolean = false;
  bestandskontrolleTasks: Auftrag[] = []; // Bestandskontrolle-Aufgaben
  isLoadingBestandskontrolle: boolean = false;

  // KDX Bereinigung Properties
  kdxTurmNr: number = 3;
  kdxTablarNr: number = 1;
  kdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
  filteredKdxRegalplaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
  isLoadingKdxBoxen: boolean = false;
  kdxReserviertFilter: string = ''; // '', 'reserviert', 'frei'
  navButtons: NavButton[] = [];
  searchTerm: string = '';
  currentView: 'kommi-auftraege' | 'einlagerungsauftraege' | 'inventur-aufgaben' | 'bestandskontrolle-aufgaben' | 'kdx-bereinigung' = 'kommi-auftraege';
  bereichNavItems: BereichNavItem[] = [
    { id: 'kommi-auftraege', label: 'Kommi Aufträge' },
    { id: 'einlagerungsauftraege', label: 'Einlagerungs Aufträge' },
    { id: 'inventur-aufgaben', label: 'Inventur Aufgaben' },
    { id: 'bestandskontrolle-aufgaben', label: 'Bestandskontrolle Aufgaben' },
    { id: 'kdx-bereinigung', label: 'KDX Bereinigung' }
  ];
  selectedPriority: string = ''; // Neues Feld für Prioritäts-Filter
  selectedStatus: string = ''; // Neues Feld für Erledigt-Filter ('', 'erledigt', 'offen')
  availablePriorities: number[] = [];
  blockedAuftraege: Set<string> = new Set(); // Blockierte Aufträge

  // Auto-Refresh
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 Sekunden


  // Pagination
  pageSize = 10;
  currentPage = 1;

  pagedFreeTasks: Auftrag[] = []; // Paginierte freie Aufträge

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.auftraege.length / this.pageSize));
  }

  get totalFreePages(): number {
    return Math.ceil(this.freeAuftraege.length / this.pageSize);
  }

  get pages(): number[] {
    // Verwende totalFreePages für freie Aufträge views
    const maxPages = this.currentView === 'einlagerungsauftraege'
      ? this.totalFreePages
      : this.totalPages;

    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }



  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    public nachrichtenService: NachrichtenService,
    private leitstandService: LeitstandService,
    private navigationService: NavigationService,
    private inventurService: InventurService
  ) { }

  ngOnInit(): void {

    // Setze explizit die Standard-Ansicht
    this.currentView = 'kommi-auftraege';

    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;
      // Nur wenn ein spezifischer Pfad existiert, überschreibe die Standard-Ansicht
      if (lastSegment && lastSegment !== 'leitstand') {
        this.currentView = lastSegment as any;
      } else {
        this.currentView = 'kommi-auftraege';
      }
      this.updatePagedTasks();

    });

    // Lade Navigation
    this.loadNavigation();

    // Lade die Aufträge
    this.loadTasks();

    // Starte Auto-Refresh
    this.startAutoRefresh();
  }

  loadNavigation(): void {
    this.navigationService.getNavButtons('/leitstand').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .subscribe(() => {
        this.loadTasks();
      });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  logout() {
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadTasks(): void {
    console.log('loadTasks() wird aufgerufen');
    this.leitstandService.getAuftraege('KOMM').subscribe({
      next: (auftraege: Auftrag[]) => {
        console.log('Aufträge empfangen:', auftraege);

        this.auftraege = auftraege
          .map((auftrag, index) => ({
            ...auftrag,
            id: index + 1
          }))
          .sort((a, b) => (a.belegnummer || '').localeCompare(b.belegnummer || ''));

        console.log('Konvertierte und sortierte Aufträge:', this.auftraege);
        console.log('Anzahl Aufträge:', this.auftraege.length);

        // Lade freie Aufträge (ohne Lagerist)
        this.loadFreeTasks();

        this.filteredAuftraege = [...this.auftraege];

        // HIER die Prioritäten aktualisieren, nachdem die Daten geladen sind:
        this.updateAvailablePriorities();

        this.updatePagedTasks();
        console.log('filteredAuftraege nach Update:', this.filteredAuftraege.length);
        console.log('currentView:', this.currentView);

        // Aktualisiere Navigation nach dem Laden
        this.navigationService.refreshCounts();
      },
      error: (err) => {
        console.error('Fehler beim Laden der Aufträge:', err);
        this.auftraege = [];
        this.filteredAuftraege = [];
        this.freeAuftraege = [];
        this.updatePagedTasks();
      }
    });

    // Lade Inventur-Aufgaben
    this.loadInventurTasks();

    // Lade Einlagerungs-Aufgaben
    this.loadEinlagerungTasks();

    this.loadBestandskontrolleTasks();

    this.loadKdxBereinigungTasks();
  }

  loadInventurTasks(): void {
    const userid = this.authService.getUsername() || '';
    console.log('Benutzer-ID:', userid);
    if (!userid) {
      console.warn('Kein Benutzer eingeloggt, Inventur-Aufgaben können nicht geladen werden');
      return;
    }

    this.isLoadingInventur = true;
    this.inventurService.getAllTasks(userid).subscribe({
      next: (tasks) => {
        this.inventurTasks = tasks;
        this.isLoadingInventur = false;
        console.log('Inventur-Aufgaben geladen:', tasks.length);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Inventur-Aufgaben:', err);
        this.inventurTasks = [];
        this.isLoadingInventur = false;
      }
    });
  }
  loadBestandskontrolleTasks(): void {

  }

  loadKdxBereinigungTasks(): void {
    this.loadKdxBoxen();
  }

  loadKdxBoxen(): void {
    if (!this.kdxTurmNr || !this.kdxTablarNr) {
      return;
    }

    this.isLoadingKdxBoxen = true;
    this.kdxRegalplaetze = [];

    this.leitstandService.getKdxBoxen(this.kdxTurmNr, this.kdxTablarNr).subscribe({
      next: (response) => {
        if (response.success && response.boxen) {
          // Flatten all storage places from all boxes
          const plaetze: (KdxRegalplatz & { releasing?: boolean })[] = [];
          response.boxen.forEach((box) => {
            box.rows.forEach((row) => {
              row.forEach((cell) => {
                plaetze.push({
                  ...cell,
                  releasing: false
                });
              });
            });
          });
          this.kdxRegalplaetze = plaetze;
          this.filterKdxRegalplaetze();
        }
        this.isLoadingKdxBoxen = false;
      },
      error: (error) => {
        console.error('Fehler beim Laden der KDX Boxen:', error);
        this.isLoadingKdxBoxen = false;
      }
    });
  }

  releaseRegalplatz(regalNr: string): void {
    const platz = this.kdxRegalplaetze.find(p => p.regalNr === regalNr);
    if (platz) {
      platz.releasing = true;
    }

    this.leitstandService.releaseKdxRegal(regalNr).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          if (platz) {
            platz.besetzt = false;
            platz.releasing = false;
          }
          this.filterKdxRegalplaetze();
        }
      },
      error: (error) => {
        console.error('Fehler beim Freigeben des Regalplatzes:', error);
        if (platz) {
          platz.releasing = false;
        }
      }
    });
  }

  getReserviertCount(): number {
    return this.kdxRegalplaetze.filter(p => p.besetzt).length;
  }

  filterKdxRegalplaetze(): void {
    const searchLower = this.searchTerm.toLowerCase().trim();

    this.filteredKdxRegalplaetze = this.kdxRegalplaetze.filter(platz => {
      // Text-basierte Suche (Regalnummer)
      const textMatch = !searchLower || platz.regalNr.toLowerCase().includes(searchLower);

      // Reserviert-Filter
      let reserviertMatch = true;
      if (this.kdxReserviertFilter === 'reserviert') {
        reserviertMatch = platz.besetzt === true;
      } else if (this.kdxReserviertFilter === 'frei') {
        reserviertMatch = platz.besetzt === false;
      }

      return textMatch && reserviertMatch;
    });
  }

  loadEinlagerungTasks(): void {
    this.isLoadingEinlagerung = true;
    this.leitstandService.getEinlagerungTasks().subscribe({
      next: (tasks) => {
        this.einlagerungTasks = tasks;
        this.isLoadingEinlagerung = false;
        console.log('Einlagerungs-Aufgaben geladen:', tasks.length);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Einlagerungs-Aufgaben:', err);
        this.einlagerungTasks = [];
        this.isLoadingEinlagerung = false;
      }
    });
  }

  loadFreeTasks(): void {
    // Filtere Aufträge ohne Lagerist
    this.freeAuftraege = this.auftraege.filter(auftrag =>
      !auftrag.lagerist || auftrag.lagerist.trim() === ''
    );
    console.log('Freie Aufträge (ohne Lagerist):', this.freeAuftraege);
    console.log('Anzahl freie Aufträge:', this.freeAuftraege.length);

    // Update paged free tasks
    this.updatePagedFreeTasks();
  }

  private updatePagedFreeTasks(): void {
    if (!Array.isArray(this.freeAuftraege)) {
      console.error('freeAuftraege ist kein Array:', this.freeAuftraege);
      this.freeAuftraege = [];
      return;
    }

    // Korrigiere currentPage falls außerhalb des Bereichs
    if (this.currentPage > this.totalFreePages && this.totalFreePages > 0) {
      this.currentPage = this.totalFreePages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedFreeTasks = this.freeAuftraege.slice(start, start + this.pageSize);

    console.log('Free Tasks Pagination:', {
      total: this.freeAuftraege.length,
      currentPage: this.currentPage,
      totalPages: this.totalFreePages,
      pagedTasks: this.pagedFreeTasks.length
    });
  }

  filterAuftraege(): void {
    const searchLower = this.searchTerm.toLowerCase().trim();

    this.filteredAuftraege = this.auftraege.filter(auftrag => {
      let lieferdatumStr = '';
      if (auftrag.lieferdatum) {
        const date = new Date(auftrag.lieferdatum);
        lieferdatumStr = date.toISOString().split('T')[0];
      }

      // Text-basierte Suche
      const textMatch = !searchLower || (
        auftrag.belegnummer?.toLowerCase().includes(searchLower) ||
        auftrag.auftragsnummer?.toLowerCase().includes(searchLower) ||
        auftrag.kunde?.toLowerCase().includes(searchLower) ||
        lieferdatumStr.includes(searchLower) ||
        (auftrag.plz && auftrag.plz.toLowerCase().includes(searchLower))
      );

      // Prioritäts-Filter (nur wenn ausgewählt)
      const priorityMatch = !this.selectedPriority ||
        auftrag.prioritaet?.toString() === this.selectedPriority;

      // Erledigt-Filter
      const auftragStatus = this.getAuftragStatus(auftrag);
      const statusMatch = !this.selectedStatus || auftragStatus === this.selectedStatus;

      return textMatch && priorityMatch && statusMatch;
    });

    this.currentPage = 1;
    this.updatePagedTasks();

    // Filter auch KDX wenn in dieser Ansicht
    if (this.currentView === 'kdx-bereinigung') {
      this.filterKdxRegalplaetze();
    }
  }
  updateAvailablePriorities() {
    const priorities = new Set<number>();

    if (this.auftraege && this.auftraege.length > 0) {
      this.auftraege.forEach(auftrag => {
        if (auftrag.prioritaet !== null && auftrag.prioritaet !== undefined) {
          priorities.add(auftrag.prioritaet);
        }
      });
    }

    this.availablePriorities = Array.from(priorities).sort((a, b) => a - b);
    console.log('Verfügbare Prioritäten:', this.availablePriorities);
  }



  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.kdxReserviertFilter = '';
    this.filterAuftraege();
    this.filterKdxRegalplaetze();
  }

  navigateToView(view: 'kommi-auftraege' | 'einlagerungsauftraege' | 'inventur-aufgaben' | 'bestandskontrolle-aufgaben' | 'kdx-bereinigung'): void {
    this.currentView = view;
    this.currentPage = 1; // Reset auf Seite 1

    if (view === 'einlagerungsauftraege') {
      this.updatePagedFreeTasks();
    } else if (view === 'kommi-auftraege' || view === 'inventur-aufgaben' || view === 'bestandskontrolle-aufgaben' || view === 'kdx-bereinigung') {
      this.updatePagedTasks();
    }
  }

  private updatePagedTasks(): void {
    if (!Array.isArray(this.auftraege)) {
      console.error('auftraege ist kein Array:', this.auftraege);
      this.auftraege = [];
      return;
    }

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;

  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.currentView === 'einlagerungsauftraege') {
        this.updatePagedFreeTasks();
      } else {
        this.updatePagedTasks();
      }
    }
  }

  nextPage(): void {
    const maxPages = this.currentView === 'einlagerungsauftraege'
      ? this.totalFreePages
      : this.totalPages;

    if (this.currentPage < maxPages) {
      this.currentPage++;
      if (this.currentView === 'einlagerungsauftraege') {
        this.updatePagedFreeTasks();
      } else {
        this.updatePagedTasks();
      }
    }
  }


  goToPage(page: number): void {
    this.currentPage = page;
    if (this.currentView === 'einlagerungsauftraege') {
      this.updatePagedFreeTasks();
    } else {
      this.updatePagedTasks();
    }
  }



  deleteAuftrag(auftragsnummer: string): void {
    if (confirm(`Möchten Sie den Auftrag ${auftragsnummer} wirklich vollständig löschen?`)) {
      this.leitstandService.deleteTask(auftragsnummer).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.msg || 'Auftrag erfolgreich gelöscht');
            // Liste neu laden
            this.loadTasks();
          } else {
            alert(response.error || 'Fehler beim Löschen des Auftrags');
          }
        },
        error: (err) => {
          console.error('Fehler beim Löschen:', err);
          alert('Fehler beim Löschen des Auftrags');
        }
      });
    }
  }

  getAuftragStatus(auftrag: Auftrag): 'offen' | 'gestartet' | 'erledigt' {
    if (!auftrag.positionen || auftrag.positionen.length === 0) {
      return 'offen';
    }

    // Prüfe ob alle Positionen erledigt sind
    const alleErledigt = auftrag.positionen.every(position =>
      position.menge_rueck > 0 &&
      position.lagerist_rueck &&
      position.lagerist_rueck.trim() !== ''
    );

    if (alleErledigt) {
      return 'erledigt';
    }

    // Prüfe ob mindestens eine Position gestartet wurde
    const hatLagerist = auftrag.positionen.some(position =>
      position.lagerist && position.lagerist.trim() !== ''
    );

    if (hatLagerist) {
      return 'gestartet';
    }

    return 'offen';
  }

  isAuftragErledigt(auftrag: Auftrag): boolean {
    return this.getAuftragStatus(auftrag) === 'erledigt';
  }
  isAuftragGestartet(auftrag: Auftrag): boolean {
    return this.getAuftragStatus(auftrag) === 'gestartet';
  }


  changePrio(auftrag: Auftrag): void {
    const belegnummer = auftrag.belegnummer;

    if (!belegnummer) {
      console.error('Keine Belegnummer vorhanden');
      return;
    }

    // Prompt für neue Priorität (1-9)
    const newPrioStr = prompt(`Neue Priorität für ${belegnummer} eingeben (1-9):`, auftrag.prioritaet?.toString() || '5');

    if (newPrioStr === null) {
      return; // Benutzer hat abgebrochen
    }

    const newPrio = parseInt(newPrioStr, 10);

    if (isNaN(newPrio) || newPrio < 1 || newPrio > 9) {
      alert('Ungültige Priorität! Bitte eine Zahl zwischen 1 und 9 eingeben.');
      return;
    }

    this.leitstandService.changePrio(belegnummer, newPrio).subscribe({
      next: (response) => {
        if (response.success) {
          alert(`Priorität für ${belegnummer} wurde auf ${newPrio} geändert.`);
          // Liste neu laden
          this.loadTasks();
        } else {
          alert(`Fehler: ${response.error || 'Unbekannter Fehler'}`);
        }
      },
      error: (err) => {
        console.error('Fehler beim Ändern der Priorität:', err);
        alert('Fehler beim Ändern der Priorität!');
      }
    });
  }

  blockAuftrag(belegnummer: string | undefined): void {
    if (!belegnummer) {
      console.error('Keine Belegnummer vorhanden');
      return;
    }

    this.leitstandService.blockKommiTask(belegnummer).subscribe({
      next: (response) => {
        if (response.success) {
          // Auftrag als blockiert markieren
          this.blockedAuftraege.add(belegnummer);
          // Liste neu laden
          this.loadTasks();
        } else {
          // Fehler-Alert anzeigen
          const alertDiv = document.createElement('div');
          alertDiv.textContent = 'Kann nicht blockiert werden';
          alertDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #f44336;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          `;
          document.body.appendChild(alertDiv);

          // Nach 3 Sekunden entfernen
          setTimeout(() => {
            document.body.removeChild(alertDiv);
          }, 3000);
        }
      },
      error: (err) => {
        console.error('Fehler beim Blockieren:', err);
        const alertDiv = document.createElement('div');
        alertDiv.textContent = 'Kann nicht blockiert werden';
        alertDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #f44336;
          color: white;
          padding: 20px 40px;
          border-radius: 8px;
          font-size: 16px;
          z-index: 10000;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
          document.body.removeChild(alertDiv);
        }, 3000);
      }
    });
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }


  isAuftragBlocked(belegnummer: string | undefined): boolean {
    if (!belegnummer) {
      return false;
    }
    return this.blockedAuftraege.has(belegnummer);
  }
}
