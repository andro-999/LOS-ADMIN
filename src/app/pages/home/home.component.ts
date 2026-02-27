import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FusszeileComponent } from '../../components/fusszeile/fusszeile.component';
import { NavBlockComponent, NavButton } from '../../components/nav-block/nav-block.component';
import { NavigationService } from '../../services/navigation.service';


@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, HeaderComponent, FusszeileComponent, NavBlockComponent],

})
export class HomeComponent implements OnInit {

  constructor(
    public router: Router,
    private authService: AuthService,
    private navigationService: NavigationService
  ) { }

  navButtons: NavButton[] = [];


  ngOnInit(): void {
    this.checkSession();
    this.loadNavigation();
  }

  loadNavigation(): void {
    this.navigationService.getNavButtons('/home').subscribe(
      buttons => this.navButtons = buttons
    );
  }

  checkSession(): void {

    const jsessionid = localStorage.getItem('JSESSIONID')

    if (!jsessionid) {
      this.authService.logout();

    }

  }
}