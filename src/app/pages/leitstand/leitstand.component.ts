import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { HeaderComponent } from '../../components/header/header.component';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { BereichNavComponent, BereichNavItem } from '../../components/bereich-nav/bereich-nav.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { NavigationService } from '../../services/navigation.service';

// Sub-Komponenten
import { KommiAuftraegeComponent } from './kommi-auftraege/kommi-auftraege.component';
import { EinlagerungAuftraegeComponent } from './einlagerung-auftraege/einlagerung-auftraege.component';
import { InventurAufgabenComponent } from './inventur-aufgaben/inventur-aufgaben.component';
import { BestandskontrolleComponent } from './bestandskontrolle/bestandskontrolle.component';
import { KdxBereinigungComponent } from './kdx-bereinigung/kdx-bereinigung.component';
import { QuickpickLogsComponent } from './quickpick-logs/quickpick-logs.component';

type ViewType = 'kommi-auftraege' | 'einlagerungsauftraege' | 'inventur-aufgaben' | 'bestandskontrolle-aufgaben' | 'kdx-bereinigung' | 'quickpick-logs';

@Component({
  selector: 'app-leitstand',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    HeaderComponent,
    NavBlockComponent,
    BereichNavComponent,
    FusszeileComponent,
    KommiAuftraegeComponent,
    EinlagerungAuftraegeComponent,
    InventurAufgabenComponent,
    BestandskontrolleComponent,
    KdxBereinigungComponent,
    QuickpickLogsComponent
  ],
  templateUrl: './leitstand.component.html',
  styleUrls: ['./leitstand.component.scss']
})
export class LeitstandComponent implements OnInit, OnDestroy {
  @ViewChild('kommiComponent') kommiComponent?: KommiAuftraegeComponent;
  @ViewChild('einlagerungComponent') einlagerungComponent?: EinlagerungAuftraegeComponent;
  @ViewChild('inventurComponent') inventurComponent?: InventurAufgabenComponent;
  @ViewChild('bestandskontrolleComponent') bestandskontrolleComponent?: BestandskontrolleComponent;
  @ViewChild('kdxComponent') kdxComponent?: KdxBereinigungComponent;
  @ViewChild('quickpickComponent') quickpickComponent?: QuickpickLogsComponent;

  navButtons: NavButton[] = [];
  currentView: ViewType = 'kommi-auftraege';

  bereichNavItems: BereichNavItem[] = [
    { id: 'kommi-auftraege', label: 'Kommi Aufträge' },
    { id: 'einlagerungsauftraege', label: 'Einlagerungs Aufträge' },
    { id: 'inventur-aufgaben', label: 'Inventur Aufgaben' },
    { id: 'bestandskontrolle-aufgaben', label: 'Bestandskontrolle Aufgaben' },
    { id: 'kdx-bereinigung', label: 'KDX Bereinigung' },
    { id: 'quickpick-logs', label: 'Quickpick Logs' }
  ];

  // Filter-State (wird an Sub-Komponenten weitergegeben)
  searchTerm: string = '';
  selectedPriority: string = '';
  selectedStatus: string = '';
  selectedGesperrt: string = '';
  kdxReserviertFilter: string = '';
  availablePriorities: number[] = [];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {
    this.currentView = 'kommi-auftraege';

    this.route.url.subscribe(urlSegments => {
      const lastSegment = urlSegments[urlSegments.length - 1]?.path;
      if (lastSegment && lastSegment !== 'leitstand') {
        this.currentView = lastSegment as ViewType;
      } else {
        this.currentView = 'kommi-auftraege';
      }
    });

    this.loadNavigation();
  }

  ngOnDestroy(): void { }

  loadNavigation(): void {
    this.navigationService.getNavButtons('/leitstand').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  navigateToView(view: ViewType): void {
    this.currentView = view;
  }

  refreshCurrentView(): void {
    switch (this.currentView) {
      case 'kommi-auftraege':
        this.kommiComponent?.loadAuftraege();
        break;
      case 'einlagerungsauftraege':
        this.einlagerungComponent?.loadEinlagerungTasks();
        break;
      case 'inventur-aufgaben':
        this.inventurComponent?.loadInventurTasks();
        break;
      case 'bestandskontrolle-aufgaben':
        this.bestandskontrolleComponent?.loadTasks();
        break;
      case 'kdx-bereinigung':
        this.kdxComponent?.loadKdxBoxen();
        break;
      case 'quickpick-logs':
        this.quickpickComponent?.loadLogs();
        break;
    }
  }

  onFilterChanged(): void {
    if (this.currentView === 'kommi-auftraege' && this.kommiComponent) {
      this.kommiComponent.searchTerm = this.searchTerm;
      this.kommiComponent.selectedPriority = this.selectedPriority;
      this.kommiComponent.selectedStatus = this.selectedStatus;
      this.kommiComponent.selectedGesperrt = this.selectedGesperrt;
      this.kommiComponent.filterAuftraege();
    }
  }

  onKdxFilterChanged(): void {
    if (this.kdxComponent) {
      this.kdxComponent.searchTerm = this.searchTerm;
      this.kdxComponent.kdxReserviertFilter = this.kdxReserviertFilter;
      this.kdxComponent.filterKdxRegalplaetze();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.selectedGesperrt = '';
    this.kdxReserviertFilter = '';
    this.onFilterChanged();
    this.onKdxFilterChanged();
  }

  onAuftraegeCountChanged(count: number): void {
    // Update priorities from kommiComponent
    if (this.kommiComponent) {
      this.availablePriorities = this.kommiComponent.availablePriorities;
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }
}
