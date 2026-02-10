import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NachrichtenService } from '../../services/nachrichten.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { LayoutComponent } from '../../components/layout/layout.component';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, LayoutComponent],

})
export class HomeComponent implements OnInit {

  constructor(public router: Router, private authService: AuthService, public nachrichtenService: NachrichtenService) { }

  zeigeNachrichten: boolean = false;
  messages: string[] = ['Nachricht 1', 'Nachricht 2', 'Nachricht 3']; // Beispiel-Daten


  ngOnInit(): void {
    this.nachrichtenService.sichtbar$.subscribe(val => this.zeigeNachrichten = val);
    this.checkSession();
  }

  checkSession(): void {

    const jsessionid = localStorage.getItem('JSESSIONID')

    if (!jsessionid) {
      this.authService.logout();

    }

  }
  logout() {
    //localStorage.setItem('username', 'Peter')
    //alert(this.username);
    //localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}