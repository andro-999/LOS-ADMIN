import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NachrichtenService } from '../../services/nachrichten.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss'
})
export class TrackingComponent {
  constructor(public router: Router, private authService: AuthService, public nachrichtenService: NachrichtenService) { }


  logout() {
    localStorage.setItem('username', 'Peter')
    //alert(this.username);
    localStorage.removeItem('username');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
