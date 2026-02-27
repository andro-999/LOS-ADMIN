import { Component, OnInit } from '@angular/core';
import { FusszeileComponent } from "../../components/fusszeile/fusszeile.component";
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { BereichNavComponent, BereichNavItem } from '../../components/bereich-nav/bereich-nav.component';
import { MatIcon } from '@angular/material/icon';
import { KardexEinlagerungModalComponent } from './kardex-einlagerung-modal/kardex-einlagerung-modal.component';




@Component({
  selector: 'app-prozessmanager',
  standalone: true,
  imports: [CommonModule, FusszeileComponent, HeaderComponent, NavBlockComponent, BereichNavComponent, MatIcon, KardexEinlagerungModalComponent],
  templateUrl: './prozessmanager.component.html',
  styleUrls: ['./prozessmanager.component.scss']
})
export class ProzessmanagerComponent implements OnInit {
  openDropdownId: string | null = null;
  navButtons: NavButton[] = [];
  currentView: string = 'admin';
  showKardexEinlagerungModal = false;
  bereichNavItems: BereichNavItem[] = [
    { id: 'admin', label: 'Admin' },
    {
      id: 'verraeumen',
      label: 'Verräumen',
      hasDropdown: true,
      subItems: [
        { id: 'leer', label: 'Leer' },
        { id: 'nachfuell', label: 'Nachfüll' },
        { id: 'einlagern', label: 'Einlagern' },
        { id: 'umlagern', label: 'Umlagern' }
      ]
    },
    { id: 'vollpalette', label: 'Vollpalette' },
    { id: 'wareneingang', label: 'Wareneingang' },
    { id: 'checken', label: 'Checken' },
    { id: 'abschlußprüfung', label: 'Abschlußprüfung' },
    { id: 'kommissionierung', label: 'Kommissionierung' },
    {
      id: 'bestand',
      label: 'Bestand',
      hasDropdown: true,
      subItems: [
        { id: 'bestandkontrolle', label: 'Bestandkontrolle' },
        { id: 'inventur', label: 'Inventur' }
      ]
    },
    { id: 'einzelflaschen', label: 'Einzelflaschen' },
    { id: 'exakt-mengen', label: 'Exakt-Mengen' },
    { id: 'rollkarte', label: 'Rollkarte' },
    { id: 'bruchÜbersicht', label: 'Bruch-Übersicht' },
    {
      id: 'kardex',
      label: 'Kardex',
      hasDropdown: true,
      subItems: [
        { id: 'kardexManagement', label: 'Management' },
        { id: 'kardexEinlagerung', label: 'Einlagerung' },
        { id: 'kardexKommissionierung', label: 'Kommissionierung' }
      ]
    }
  ];


  constructor(
    public router: Router,
    private authService: AuthService,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
  }

  /**
   * Handles navigation item clicks
   * For items with dropdown: toggles the dropdown
   * For regular items: navigates to the view
   */
  navigateToView(viewId: string): void {
    // Find the item
    const item = this.bereichNavItems.find(i => i.id === viewId);

    if (item?.hasDropdown) {
      // Toggle dropdown
      this.openDropdownId = this.openDropdownId === viewId ? null : viewId;
    } else {
      // Close all dropdowns and navigate
      this.openDropdownId = null;
      this.currentView = viewId;
    }
  }

  /**
   * Handles sub-item selection from dropdowns
   */
  onSubViewChanged(subViewId: string): void {
    this.currentView = subViewId;

    // Special handling for Kardex-Einlagerung
    if (subViewId === 'kardexEinlagerung') {
      this.showKardexEinlagerungModal = true;
    }
  }

  closeKardexEinlagerungModal(): void {
    this.showKardexEinlagerungModal = false;
    this.openDropdownId = null;
    this.currentView = 'admin';
  }


  loadNavigation(): void {
    this.navigationService.getNavButtons('/prozessmanager').subscribe(
      buttons => this.navButtons = buttons
    );
  }
}
