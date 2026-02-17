import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavigationService } from '../../services/navigation.service';
import { MatIcon } from '@angular/material/icon';
import { BereichNavComponent, BereichNavItem } from '../../components/bereich-nav/bereich-nav.component';
import { NavButton } from '../../components/nav-block/nav-block.component';
//import { NavBtnComponent } from '../../components/nav-btn/nav-btn.component';
import { NavBlockComponent } from '../../components/nav-block/nav-block.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { OnInit } from '@angular/core';



@Component({
  selector: 'app-konfiguration',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatIcon, BereichNavComponent, NavBlockComponent, FusszeileComponent],
  templateUrl: './konfiguration.component.html',
  styleUrls: ['./konfiguration.component.scss']
})
export class KonfigurationComponent implements OnInit {
  navButtons: NavButton[] = [];
  bereichNavItems: BereichNavItem[] = [
    { id: 'prozessmanager', label: 'Prozessmanager' },
    { id: 'gs1-etikett', label: 'GS1-Etikett' },
    { id: 'breakage', label: 'Breakage' },
    { id: 'waybill', label: 'Waybill' },
    { id: 'split', label: 'Split' },
    { id: 'slotmanager', label: 'Slotmanager' },
    { id: 'storeput', label: 'Storeput' },
    { id: 'kdxpallettypes', label: 'KDXPallettypes' },
    { id: 'global', label: 'Global' }
  ];

  currentView: string = 'prozessmanager';

  constructor(
    public router: Router,
    private authService: AuthService,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {
    this.loadNavigation();
  }


  navigateToView(view: 'prozessmanager' | 'gs1-etikett' | 'breakage' | 'waybill' | 'split' | 'slotmanager' | 'storeput' | 'kdxpallettypes' | 'global'): void {
    this.currentView = view;
  }

  loadNavigation(): void {
    this.navigationService.getNavButtons('/konfiguration').subscribe(
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
}
