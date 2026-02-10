import { Component, OnInit } from '@angular/core';
//import { LayoutComponent } from '../../components/layout/layout.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NachrichtenService } from '../../services/nachrichten.service';
import { MatIcon } from '@angular/material/icon';
import { User, UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeitstandService, Auftrag } from './leitstand.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-leitstand',
  standalone: true,
  imports: [MatIcon, CommonModule, FormsModule, HeaderComponent],
  templateUrl: './leitstand.component.html',
  styleUrls: ['./leitstand.component.scss']
})
export class LeitstandComponent implements OnInit {
  zeigeNachrichten: boolean = false;
  auftraege: Auftrag[] = [];
  filteredAuftraege: Auftrag[] = [];
  freeAuftraege: Auftrag[] = []; // Aufträge ohne Lagerist
  searchTerm: string = '';
  currentView: 'alle-auftraege' | 'auftrag-loeschen' | 'position-loeschen' | 'prioritaet-aendern' | 'auftrag-blockieren' = 'alle-auftraege';
  selectedPriority: string = ''; // Neues Feld für Prioritäts-Filter
  selectedStatus: string = ''; // Neues Feld für Erledigt-Filter ('', 'erledigt', 'offen')
  availablePriorities: number[] = [];
  blockedAuftraege: Set<string> = new Set(); // Blockierte Aufträge

  // Position löschen Felder
  belegnummer: string = '';
  zeilennummer: string = '';
  deleteMessage: string = '';
  deleteError: string = '';
  isDeleting: boolean = false;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  pagedTasks: Auftrag[] = [];
  pagedFreeTasks: Auftrag[] = []; // Paginierte freie Aufträge

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.auftraege.length / this.pageSize));
  }

  get totalFreePages(): number {
    return Math.ceil(this.freeAuftraege.length / this.pageSize);
  }

  get pages(): number[] {
    // Verwende totalFreePages für freie Aufträge views
    const maxPages = this.currentView === 'auftrag-loeschen' || this.currentView === 'prioritaet-aendern'
      ? this.totalFreePages
      : this.totalPages;

    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  get bereichText(): string {
    switch (this.currentView) {
      case 'alle-auftraege': return 'Leitstand - Alle Aufträge';
      case 'auftrag-loeschen': return 'Leitstand - Auftrag löschen';
      case 'position-loeschen': return 'Leitstand - Position löschen';
      case 'prioritaet-aendern': return 'Leitstand - Priorität ändern';
      case 'auftrag-blockieren': return 'Leitstand - Auftrag blockieren';
      default: return 'Leitstand';
    }
  }

  constructor(public router: Router, private route: ActivatedRoute, private authService: AuthService, public nachrichtenService: NachrichtenService, private userService: UserService, private leitstandService: LeitstandService) { }

  ngOnInit(): void {
    this.nachrichtenService.sichtbar$.subscribe(val => this.zeigeNachrichten = val);

    // Setze explizit die Standard-Ansicht
    this.currentView = 'alle-auftraege';

    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;
      // Nur wenn ein spezifischer Pfad existiert, überschreibe die Standard-Ansicht
      if (lastSegment && lastSegment !== 'leitstand') {
        this.currentView = lastSegment as any;
      } else {
        this.currentView = 'alle-auftraege';
      }
      this.updatePagedTasks();

    });
    // ENTFERNEN Sie diese Zeile - sie wird zu früh aufgerufen:
    // this.updateAvailablePriorities();

    // Lade die Aufträge
    this.loadTasks();
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
        console.log('pagedTasks nach Update:', this.pagedTasks);
        console.log('currentView:', this.currentView);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Aufträge:', err);
        this.auftraege = [];
        this.filteredAuftraege = [];
        this.freeAuftraege = [];
        this.updatePagedTasks();
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
      const statusMatch = !this.selectedStatus ||
        (this.selectedStatus === 'erledigt' && auftrag.erledigt === true) ||
        (this.selectedStatus === 'offen' && auftrag.erledigt === false);

      return textMatch && priorityMatch && statusMatch;
    });

    this.currentPage = 1;
    this.updatePagedTasks();
    // ENTFERNEN: Die Zeile unten nicht hier aufrufen, da sie die Prioritäten der ORIGINALEN Liste nimmt
    // this.updateAvailablePriorities();
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

  clearSearch(): void {
    this.searchTerm = '';
    this.filterAuftraege();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.filterAuftraege();
  }

  navigateToView(view: 'alle-auftraege' | 'auftrag-loeschen' | 'position-loeschen' | 'prioritaet-aendern' | 'auftrag-blockieren'): void {
    this.currentView = view;
    this.currentPage = 1; // Reset auf Seite 1

    if (view === 'auftrag-loeschen' || view === 'prioritaet-aendern') {
      this.updatePagedFreeTasks();
    } else if (view === 'position-loeschen' || view === 'alle-auftraege') {
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
    this.pagedTasks = this.auftraege.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.currentView === 'auftrag-loeschen' || this.currentView === 'prioritaet-aendern') {
        this.updatePagedFreeTasks();
      } else {
        this.updatePagedTasks();
      }
    }
  }

  nextPage(): void {
    const maxPages = this.currentView === 'auftrag-loeschen' || this.currentView === 'prioritaet-aendern'
      ? this.totalFreePages
      : this.totalPages;

    if (this.currentPage < maxPages) {
      this.currentPage++;
      if (this.currentView === 'auftrag-loeschen' || this.currentView === 'prioritaet-aendern') {
        this.updatePagedFreeTasks();
      } else {
        this.updatePagedTasks();
      }
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    if (this.currentView === 'auftrag-loeschen' || this.currentView === 'prioritaet-aendern') {
      this.updatePagedFreeTasks();
    } else {
      this.updatePagedTasks();
    }
  }

  deletePosition(): void {
    if (!this.belegnummer || !this.zeilennummer) {
      this.deleteError = 'Bitte füllen Sie beide Felder aus.';
      this.deleteMessage = '';
      return;
    }

    this.isDeleting = true;
    this.deleteMessage = '';
    this.deleteError = '';

    this.leitstandService.deletePartOfKommiTask(this.belegnummer, this.zeilennummer)
      .subscribe({
        next: (response) => {
          this.isDeleting = false;
          if (response.success) {
            this.deleteMessage = response.msg || 'Position erfolgreich gelöscht!';
            this.deleteError = '';
            this.belegnummer = '';
            this.zeilennummer = '';
          } else {
            this.deleteError = response.error || 'Ein Fehler ist aufgetreten.';
            this.deleteMessage = '';
          }
        },
        error: (err) => {
          this.isDeleting = false;
          this.deleteError = 'Fehler beim Löschen der Position: ' + (err.message || 'Unbekannter Fehler');
          this.deleteMessage = '';
        }
      });
  }

  deleteAuftrag(auftragsnummer: string): void {
    if (confirm(`Möchten Sie den Auftrag ${auftragsnummer} wirklich vollständig löschen?`)) {
      this.leitstandService.deleteTask(auftragsnummer).subscribe({
        next: (response) => {
          if (response.success) {
            // Entferne den Auftrag aus allen Listen
            this.auftraege = this.auftraege.filter(a => a.auftragsnummer !== auftragsnummer);
            this.freeAuftraege = this.freeAuftraege.filter(a => a.auftragsnummer !== auftragsnummer);
            this.filteredAuftraege = this.filteredAuftraege.filter(a => a.auftragsnummer !== auftragsnummer);

            this.updatePagedTasks();
            this.updatePagedFreeTasks();

            alert(response.msg || 'Auftrag erfolgreich gelöscht');
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

  isAuftragErledigt(auftrag: Auftrag): boolean {
    if (!auftrag.positionen || auftrag.positionen.length === 0) {
      return false;
    }

    return auftrag.positionen.every(position =>
      position.lagerist && position.lagerist.trim() !== ''
    );
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

  isAuftragBlocked(belegnummer: string | undefined): boolean {
    if (!belegnummer) {
      return false;
    }
    return this.blockedAuftraege.has(belegnummer);
  }
}
