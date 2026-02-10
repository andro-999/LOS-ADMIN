import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { MatIcon } from "@angular/material/icon";


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})




export class SidebarComponent {
  isLoggedIn: boolean = false; // Standardmäßig nicht eingeloggt
  @Input() showNav: boolean = true;
  //showNav: boolean = true;
  verwaltungOpen: boolean = false;
  leitstandOpen: boolean = false;
  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        this.verwaltungOpen = this.isVerwatungChild(url);
        this.leitstandOpen = this.isLeitstandChild(url);
      });
  }
  private isVerwatungChild(url: string): boolean {
    const prefixes = [
      '/mailverwaltung',
      '/adminverwaltung',
      '/benutzerverwaltung',
      '/stellplatzverwaltung',
      '/kardexverwaltung'
    ];
    return prefixes.some(p => url.startsWith(p));
  }
  private isLeitstandChild(url: string): boolean {
    const prefixes = [
      '/leitstand/auftrag-loeschen',
      '/leitstand/position-loeschen',
      '/leitstand/prioritaet-aendern',
      '/leitstand/auftrag-blockieren'
    ];
    return prefixes.some(p => url.startsWith(p));
  }
  openVerwaltung() {
    this.verwaltungOpen = true;
  }

  closeVerwaltung() {
    this.verwaltungOpen = false;
  }
  openLeitstand() {
    this.leitstandOpen = true;
  }
  closeLeitstand() {
    this.leitstandOpen = false;
  }
  ngOnInit(): void {
    // Prüfen, ob der Benutzer eingeloggt ist (z. B. durch Überprüfung von localStorage)
    const jsessionid = localStorage.getItem('JSESSIONID');
    this.isLoggedIn = !!jsessionid; // true, wenn JSESSIONID vorhanden ist
  }

  toggleVerwaltung() {
    this.verwaltungOpen = !this.verwaltungOpen;
  }
  toggleLeitstand() {
    this.leitstandOpen = !this.leitstandOpen;
  }
}


